import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Analysis } from "@/models/Analysis";
import { EAcknowledgement } from "@/models/EAcknowledgement";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";
import mongoose from "mongoose";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyMt5Signature, parseMt5Headers } from "@/lib/security/mt5-signing";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const MT5_RATE_LIMIT = { limit: 120, windowMs: 60_000 };

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Read the raw request body as text (needed for HMAC verification). */
async function readBodyText(req: Request): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  if (!reader) return "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function authorizedWithSignature(
  req: Request,
  bodyText: string
): Promise<{ user: Awaited<ReturnType<typeof User.findOne>> | null; reason?: string }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const rawToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!rawToken) {
    return { user: null, reason: "missing_bearer_token" };
  }

  const hash = tokenHash(rawToken);
  await dbConnect();
  const user = await User.findOne({ eaTokenHash: hash }).select("+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt brokerAutomationEnabled brokerAutomationMode brokerRiskPercent mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil mt5LastHeartbeatAt mt5Runtime");
  if (!user || !hasBrokerAutomationAccess(user)) {
    return { user: null, reason: "unauthorized_or_no_broker_access" };
  }

  // HMAC verification: signing key = eaTokenHash (= SHA256(rawToken)), derivable by both sides.
  const { timestampSec, nonce, signature } = parseMt5Headers(req.headers);
  if (!timestampSec || !nonce || !signature) {
    return { user: null, reason: "missing_mt5_headers" };
  }

  const verify = verifyMt5Signature(hash, timestampSec, nonce, bodyText, signature);
  if (!verify.ok) {
    await recordSecurityEvent({
      type: "unauthorized_access",
      userId: user._id.toString(),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? null,
      details: { reason: verify.reason },
      severity: "high",
    });
    return { user: null, reason: verify.reason };
  }

  return { user, reason: undefined };
}

export async function GET(req: Request) {
  try {
    const limited = rateLimitResponse(rateLimit(req, { key: "mt5-automation", limit: MT5_RATE_LIMIT.limit, windowMs: MT5_RATE_LIMIT.windowMs }));
    if (limited) return limited;

    const bodyText = await readBodyText(req);
    const auth = await authorizedWithSignature(req, bodyText);
    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized or Broker plan required", reason: auth.reason }, { status: 401 });
    }
    const user = auth.user;

    const mode = user.brokerAutomationMode ?? "normal";
    const base = { automationMode: mode, riskPercent: mode === "scalping" ? Math.min(user.brokerRiskPercent ?? 0.05, 0.05) : user.brokerRiskPercent ?? 0.5 };
    if (!user.brokerAutomationEnabled) return NextResponse.json({ ...base, signal: null, enabled: false, status: "dashboard_disabled" });
    const heartbeatFresh = !!user.mt5LastHeartbeatAt && Date.now() - user.mt5LastHeartbeatAt.getTime() <= 45_000;
    const runtime = user.mt5Runtime;
    const runtimeReady = heartbeatFresh && !!runtime?.executionEnabled
      && !!runtime.terminalTradeAllowed && !!runtime.accountTradeAllowed && !!runtime.expertTradeAllowed
      && !!runtime.demoAccount && !runtime.liveTradingAllowed
      && (mode !== "scalping" || !!runtime.chartM1);
    if (!runtimeReady) return NextResponse.json({ ...base, signal: null, enabled: true, status: "mt5_not_ready" });
    if (user.mt5LeaseUntil && user.mt5LeaseUntil > new Date()) return NextResponse.json({ ...base, signal: null, enabled: true, status: "signal_leased", busy: true });
    const after = user.mt5LastSignalId && mongoose.isValidObjectId(user.mt5LastSignalId)
      ? new mongoose.Types.ObjectId(user.mt5LastSignalId)
      : null;
    const automationModeFilter = mode === "normal"
      ? { $or: [{ automationMode: "normal" as const }, { automationMode: { $exists: false } }] }
      : { automationMode: "scalping" as const };
    const signal = await Analysis.findOne({
      userId: user._id,
      published: true,
      automationEligible: true,
      ...automationModeFilter,
      signalStatus: "active",
      direction: { $in: ["buy", "sell"] },
      ...(after ? { _id: { $gt: after } } : {}),
    }).sort({ _id: 1 }).lean();
    if (!signal) return NextResponse.json({ ...base, signal: null, enabled: true, status: "waiting_for_signal" });
    const automationTarget = signal.takeProfits?.find((target) => target.riskReward >= (mode === "scalping" ? 1.2 : 1.5));
    if (!automationTarget) return NextResponse.json({ ...base, signal: null, enabled: true, status: "no_eligible_target" });
    const leased = await User.findOneAndUpdate(
      {
        _id: user._id,
        mt5LastSignalId: user.mt5LastSignalId ?? null,
        $or: [{ mt5LeaseUntil: null }, { mt5LeaseUntil: { $lte: new Date() } }],
      },
      { $set: { mt5LeaseSignalId: signal._id.toString(), mt5LeaseUntil: new Date(Date.now() + 60_000) } },
      { new: true }
    );
    if (!leased) return NextResponse.json({ ...base, signal: null, enabled: true, status: "signal_leased", busy: true });
    return NextResponse.json({ ...base, enabled: true, id: signal._id.toString(), symbol: signal.symbol, direction: signal.direction, entryPrice: signal.entryPrice, stopLoss: signal.stopLoss, takeProfit: automationTarget.price, createdAt: Math.floor(new Date(signal.createdAt).getTime() / 1000), timeframe: signal.timeframe }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(rateLimit(req, { key: "mt5-automation", limit: MT5_RATE_LIMIT.limit, windowMs: MT5_RATE_LIMIT.windowMs }));
    if (limited) return limited;

    const bodyText = await readBodyText(req);
    const auth = await authorizedWithSignature(req, bodyText);
    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized or Broker plan required", reason: auth.reason }, { status: 401 });
    }
    const user = auth.user;

    const body = JSON.parse(bodyText);
    if (typeof body.signalId !== "string" || typeof body.status !== "string" || !/^[a-f\d]{24}$/i.test(body.signalId) || !/^[a-z_]{2,40}$/i.test(body.status)) return NextResponse.json({ error: "Invalid acknowledgement" }, { status: 400 });
    const prior = await EAcknowledgement.findOne({ userId: user._id, signalId: body.signalId });
    if (prior) return NextResponse.json({ acknowledged: true, status: prior.status });

    const mode = user.brokerAutomationMode ?? "normal";
    const automationModeFilter = mode === "normal"
      ? { $or: [{ automationMode: "normal" as const }, { automationMode: { $exists: false } }] }
      : { automationMode: "scalping" as const };
    const signal = await Analysis.findOne({ _id: body.signalId, userId: user._id, published: true, automationEligible: true, ...automationModeFilter, signalStatus: "active", direction: { $in: ["buy", "sell"] } });
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    const after = user.mt5LastSignalId && mongoose.isValidObjectId(user.mt5LastSignalId)
      ? new mongoose.Types.ObjectId(user.mt5LastSignalId)
      : null;
    const nextSignal = await Analysis.findOne({
      userId: user._id,
      published: true,
      automationEligible: true,
      ...automationModeFilter,
      signalStatus: "active",
      direction: { $in: ["buy", "sell"] },
      ...(after ? { _id: { $gt: after } } : {}),
    }).sort({ _id: 1 }).select("_id").lean();
    if (!nextSignal || nextSignal._id.toString() !== body.signalId) {
      return NextResponse.json({ error: "Signal is not the next queued item" }, { status: 409 });
    }

    const acknowledgement = await EAcknowledgement.create({ userId: user._id, signalId: signal._id, status: body.status, details: typeof body.details === "string" ? body.details.slice(0, 500) : "", brokerOrderId: typeof body.brokerOrderId === "string" ? body.brokerOrderId.slice(0, 80) : "" });
    user.mt5LastSignalId = signal._id.toString();
    user.mt5LeaseSignalId = null;
    user.mt5LeaseUntil = null;
    await user.save();

    await recordSecurityEvent({
      type: "signal_executed",
      userId: user._id.toString(),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? null,
      details: { signalId: signal._id.toString(), status: body.status, symbol: signal.symbol, direction: signal.direction },
      severity: "medium",
    });

    return NextResponse.json({ acknowledged: true, status: acknowledgement.status });
  } catch {
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}
