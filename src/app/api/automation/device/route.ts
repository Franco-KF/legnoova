import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Analysis } from "@/models/Analysis";
import { EAcknowledgement } from "@/models/EAcknowledgement";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";
import mongoose from "mongoose";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

function tokenHash(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return token ? createHash("sha256").update(token).digest("hex") : "";
}

async function authorized(req: Request) {
  const hash = tokenHash(req);
  if (!hash) return null;
  await dbConnect();
  const user = await User.findOne({ eaTokenHash: hash }).select("+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt brokerAutomationEnabled brokerAutomationMode brokerRiskPercent mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil");
  if (!user || !hasBrokerAutomationAccess(user)) return null;
  return user;
}

export async function GET(req: Request) {
  try {
    const limited = rateLimitResponse(rateLimit(req, { key: "mt5-automation", limit: 60, windowMs: 60_000 }));
    if (limited) return limited;
    const user = await authorized(req);
    if (!user) return NextResponse.json({ error: "Unauthorized or Broker plan required" }, { status: 401 });
    if (!user.brokerAutomationEnabled) return NextResponse.json({ signal: null, enabled: false });
    if (user.mt5LeaseUntil && user.mt5LeaseUntil > new Date()) return NextResponse.json({ signal: null, enabled: true, busy: true });
    const after = user.mt5LastSignalId && mongoose.isValidObjectId(user.mt5LastSignalId)
      ? new mongoose.Types.ObjectId(user.mt5LastSignalId)
      : null;
    const mode = user.brokerAutomationMode ?? "normal";
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
    if (!signal) return NextResponse.json({ signal: null, enabled: true });
    const leased = await User.findOneAndUpdate(
      {
        _id: user._id,
        mt5LastSignalId: user.mt5LastSignalId ?? null,
        $or: [{ mt5LeaseUntil: null }, { mt5LeaseUntil: { $lte: new Date() } }],
      },
      { $set: { mt5LeaseSignalId: signal._id.toString(), mt5LeaseUntil: new Date(Date.now() + 60_000) } },
      { new: true }
    );
    if (!leased) return NextResponse.json({ signal: null, enabled: true, busy: true });
    const automationTarget = signal.takeProfits?.find((target) => target.riskReward >= (mode === "scalping" ? 1.2 : 1.5));
    if (!automationTarget) return NextResponse.json({ signal: null, enabled: true });
    return NextResponse.json({ enabled: true, riskPercent: user.brokerRiskPercent ?? 0.5, signal: { id: signal._id.toString(), symbol: signal.symbol, direction: signal.direction, entryPrice: signal.entryPrice, stopLoss: signal.stopLoss, takeProfit: automationTarget.price, createdAt: Math.floor(new Date(signal.createdAt).getTime() / 1000), timeframe: signal.timeframe, automationMode: mode } });
  } catch {
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(rateLimit(req, { key: "mt5-automation", limit: 60, windowMs: 60_000 }));
    if (limited) return limited;
    const user = await authorized(req);
    if (!user) return NextResponse.json({ error: "Unauthorized or Broker plan required" }, { status: 401 });
    const body = await req.json();
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
    return NextResponse.json({ acknowledged: true, status: acknowledgement.status });
  } catch {
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}
