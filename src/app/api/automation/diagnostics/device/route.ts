import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

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

export async function GET(req: Request) {
  const limited = rateLimitResponse(rateLimit(req, { key: "mt5-diagnostics", limit: 120, windowMs: 60_000 }));
  if (limited) return limited;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const hash = createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ eaTokenHash: hash }).select("+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt brokerAutomationEnabled brokerAutomationMode brokerRiskPercent mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil mt5LastHeartbeatAt mt5Runtime");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAutomationDiagnostics(user), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const limited = rateLimitResponse(rateLimit(req, { key: "mt5-diagnostics-heartbeat", limit: 240, windowMs: 60_000 }));
  if (limited) return limited;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = runtimeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid MT5 heartbeat" }, { status: 400 });
  await dbConnect();
  const hash = createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ eaTokenHash: hash }).select("_id");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await User.updateOne({ _id: user._id }, { $set: { mt5Runtime: parsed.data, mt5LastHeartbeatAt: new Date() } });
  return NextResponse.json({ recorded: true });
}
