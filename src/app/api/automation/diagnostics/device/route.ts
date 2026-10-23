import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import { verifyMt5Signature, parseMt5Headers } from "@/lib/security/mt5-signing";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const runtimeSchema = z.object({
  executionEnabled: z.boolean(),
  terminalTradeAllowed: z.boolean(),
  accountTradeAllowed: z.boolean(),
  expertTradeAllowed: z.boolean(),
  demoAccount: z.boolean(),
  chartM1: z.boolean(),
  liveTradingAllowed: z.boolean(),
  accountCurrency: z.string().regex(/^[A-Za-z0-9._-]{0,10}$/),
  eaOpenPositions: z.number().int().min(0).max(100),
  eaFloatingProfit: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  status: z.string().regex(/^[a-z_]{2,40}$/),
}).strict();

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

async function authorizeDevice(
  req: Request,
  bodyText: string
): Promise<{ userId: string | null; reason?: string }> {
  const authHeader = req.headers.get("authorization") ?? "";
  const rawToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!rawToken) return { userId: null, reason: "missing_bearer_token" };

  const hash = createHash("sha256").update(rawToken).digest("hex");
  await dbConnect();
  const user = await User.findOne({ eaTokenHash: hash }).select("_id");
  if (!user) return { userId: null, reason: "unauthorized" };

  const { timestampSec, nonce, signature } = parseMt5Headers(req.headers);
  if (!timestampSec || !nonce || !signature) {
    return { userId: null, reason: "missing_mt5_headers" };
  }

  const verify = verifyMt5Signature(hash, timestampSec, nonce, bodyText, signature);
  if (!verify.ok) {
    await recordSecurityEvent({
      type: "unauthorized_access",
      userId: user._id.toString(),
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? null,
      details: { reason: verify.reason, endpoint: "diagnostics" },
      severity: "high",
    });
    return { userId: null, reason: verify.reason };
  }

  return { userId: user._id.toString() };
}

export async function GET(req: Request) {
  const limited = rateLimitResponse(rateLimit(req, { key: "mt5-diagnostics", limit: 120, windowMs: 60_000 }));
  if (limited) return limited;

  const bodyText = await readBodyText(req);
  const auth = await authorizeDevice(req, bodyText);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ eaTokenHash: createHash("sha256").update(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "").digest("hex") }).select("+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt brokerAutomationEnabled brokerAutomationMode brokerRiskPercent mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil mt5LastHeartbeatAt mt5Runtime");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAutomationDiagnostics(user), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(rateLimit(req, { key: "mt5-diagnostics-heartbeat", limit: 240, windowMs: 60_000 }));
  if (limited) return limited;

  const bodyText = await readBodyText(req);
  const auth = await authorizeDevice(req, bodyText);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  const parsed = runtimeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid MT5 heartbeat" }, { status: 400 });
  await dbConnect();
  const user = await User.findOne({ eaTokenHash: createHash("sha256").update(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "").digest("hex") }).select("_id");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await User.updateOne({ _id: user._id }, { $set: { mt5Runtime: parsed.data, mt5LastHeartbeatAt: new Date() } });

  await recordSecurityEvent({
    type: "bridge_heartbeat",
    userId: user._id.toString(),
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? null,
    details: { status: parsed.data.status, executionEnabled: parsed.data.executionEnabled, demoAccount: parsed.data.demoAccount },
    severity: "low",
  });

  return NextResponse.json({ recorded: true });
}
