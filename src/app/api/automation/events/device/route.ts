import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { AutomationTradeEvent } from "@/models/AutomationTradeEvent";
import { rateLimitAsync, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import {
  authorizeMt5Device,
  parseJsonBody,
  readBodyText,
} from "@/lib/mt5/device-auth";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const eventSchema = z
  .object({
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
  })
  .strict();

export async function POST(req: Request) {
  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "mt5-trade-events",
      limit: 240,
      windowMs: 60_000,
    })
  );
  if (limited) return limited;

  const body = await readBodyText(req);
  if (body.tooLarge) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  const auth = await authorizeMt5Device(req, {
    bodyText: body.text,
    endpoint: "trade-events",
  });
  if (!auth.user) {
    return NextResponse.json(
      { error: "Unauthorized", reason: auth.reason },
      { status: auth.status ?? 401 }
    );
  }

  const parsed = eventSchema.safeParse(parseJsonBody(body.text));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid MT5 trade event" }, { status: 400 });
  }

  const occurredAt = new Date(parsed.data.occurredAt * 1000);
  const ageMs = Date.now() - occurredAt.getTime();
  if (
    !Number.isFinite(occurredAt.getTime()) ||
    ageMs < -5 * 60_000 ||
    ageMs > 30 * 24 * 60 * 60_000
  ) {
    return NextResponse.json(
      { error: "MT5 trade event timestamp is outside the accepted window" },
      { status: 400 }
    );
  }

  await dbConnect();
  const existing = await AutomationTradeEvent.findOne({
    userId: auth.user._id,
    dealId: parsed.data.dealId,
  })
    .select("_id")
    .lean();
  if (existing) return NextResponse.json({ recorded: true, duplicate: true });

  try {
    await AutomationTradeEvent.create({
      ...parsed.data,
      userId: auth.user._id,
      occurredAt,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json({ recorded: true, duplicate: true });
    }
    return NextResponse.json(
      { error: "Could not record MT5 trade event" },
      { status: 500 }
    );
  }

  await recordSecurityEvent({
    type: "trade_event_received",
    userId: auth.user._id.toString(),
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? null,
    details: {
      signalId: parsed.data.signalId,
      dealId: parsed.data.dealId,
      eventType: parsed.data.eventType,
      symbol: parsed.data.symbol,
    },
    severity: "medium",
  });

  return NextResponse.json({ recorded: true, duplicate: false });
}
