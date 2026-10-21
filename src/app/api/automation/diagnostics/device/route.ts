import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = rateLimitResponse(rateLimit(req, { key: "mt5-diagnostics", limit: 30, windowMs: 60_000 }));
  if (limited) return limited;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const hash = createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ eaTokenHash: hash }).select("+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt brokerAutomationEnabled brokerRiskPercent mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAutomationDiagnostics(user), { headers: { "Cache-Control": "no-store" } });
}
