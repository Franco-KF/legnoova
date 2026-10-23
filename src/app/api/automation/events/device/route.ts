import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { AutomationTradeEvent } from "@/models/AutomationTradeEvent";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { verifyMt5Signature, parseMt5Headers } from "@/lib/security/mt5-signing";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const eventSchema = z.object({
  signalId: z.string().regex(/^[a-f\d]{24}$/i),
  dealId: z.string().regex(/^\d{1,80}$/),
  brokerOrderId: z.string().max(80),
  eventType: z.enum(["entry", "exit"]),
  symbol: z.string().regex(/^[A-Za-z0-9._-]{1,32}$/),
  currency: z.string().regex(/^[A-Za-z0-9._-]{0,10}$/),
  volume: z.number().finite().positive().max(1000),
  price: z.number().finite().positive(),
  netProfit: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  occurredAt: z.number().int().positive(),
}).strict();

/** Read raw body for HMAC verification. */
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
      details: { reason: verify.reason, endpoint: "trade-events" },
      severity: "high",
    });
    return { userId: null, reason: verify.reason };
  }

  return { userId: user._id.toString() };
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(rateLimit(req, { key: "mt5-trade-events", limit: 240, windowMs: 60_000 }));
  if (limited) return limited;

  const bodyText = await readBodyText(req);
  const auth = await authorizeDevice(req, bodyText);
  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized", reason: auth.reason }, { status: 401 });
  }

  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid MT5 trade event" }, { status: 400 });

  const occurredAt = new Date(parsed.data.occurredAt * 1000);
  const ageMs = Date.now() - occurredAt.getTime();
  if (!Number.isFinite(occurredAt.getTime()) || ageMs < -5 * 60_000 || ageMs > 30 * 24 * 60 * 60_000) {
    return NextResponse.json({ error: "MT5 trade event timestamp is outside the accepted window" }, { status: 400 });
  }
  await dbConnect();
  const existing = await AutomationTradeEvent.findOne({ userId: auth.userId, dealId: parsed.data.dealId }).select("_id").lean();
  if (existing) return NextResponse.json({ recorded: true, duplicate: true });
  try {
    await AutomationTradeEvent.create({
      ...parsed.data,
      userId: auth.userId,
      occurredAt,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ recorded: true, duplicate: true });
    }
    return NextResponse.json({ error: "Could not record MT5 trade event" }, { status: 500 });
  }

  await recordSecurityEvent({
    type: "trade_event_received",
    userId: auth.userId,
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? null,
    details: { signalId: parsed.data.signalId, dealId: parsed.data.dealId, eventType: parsed.data.eventType, symbol: parsed.data.symbol },
    severity: "medium",
  });

  return NextResponse.json({ recorded: true, duplicate: false });
}
