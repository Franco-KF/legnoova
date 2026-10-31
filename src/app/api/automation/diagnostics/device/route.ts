import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";
import {
  rateLimitAsync,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";
import { z } from "zod";
import {
  authorizeMt5Device,
  parseJsonBody,
  readBodyText,
} from "@/lib/mt5/device-auth";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const runtimeSchema = z
  .object({
    executionEnabled: z.boolean(),
    terminalTradeAllowed: z.boolean(),
    accountTradeAllowed: z.boolean(),
    expertTradeAllowed: z.boolean(),
    demoAccount: z.boolean(),
    chartM1: z.boolean(),
    liveTradingAllowed: z.boolean(),
    accountCurrency: z.string().regex(/^[A-Za-z0-9._-]{0,10}$/),
    eaOpenPositions: z.number().int().min(0).max(100),
    eaFloatingProfit: z
      .number()
      .finite()
      .min(-1_000_000_000)
      .max(1_000_000_000),
    status: z.string().regex(/^[a-z_]{2,40}$/),
  })
  .strict();

export async function GET(req: Request) {
  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "mt5-diagnostics",
      limit: 120,
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
    endpoint: "diagnostics",
  });
  if (!auth.user) {
    return NextResponse.json(
      { error: "Unauthorized", reason: auth.reason },
      { status: auth.status ?? 401 }
    );
  }

  return NextResponse.json(await getAutomationDiagnostics(auth.user), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "mt5-diagnostics-heartbeat",
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
    endpoint: "diagnostics-heartbeat",
  });
  if (!auth.user) {
    return NextResponse.json(
      { error: "Unauthorized", reason: auth.reason },
      { status: auth.status ?? 401 }
    );
  }

  const parsed = runtimeSchema.safeParse(parseJsonBody(body.text));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid MT5 heartbeat" }, { status: 400 });
  }

  await dbConnect();
  await User.updateOne(
    { _id: auth.user._id },
    { $set: { mt5Runtime: parsed.data, mt5LastHeartbeatAt: new Date() } }
  );

  await recordSecurityEvent({
    type: "bridge_heartbeat",
    userId: auth.user._id.toString(),
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? null,
    details: {
      status: parsed.data.status,
      executionEnabled: parsed.data.executionEnabled,
      demoAccount: parsed.data.demoAccount,
    },
    severity: "low",
  });

  return NextResponse.json({ recorded: true });
}
