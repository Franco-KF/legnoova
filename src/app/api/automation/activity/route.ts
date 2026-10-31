import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { AutomationTradeEvent } from "@/models/AutomationTradeEvent";
import { EAcknowledgement } from "@/models/EAcknowledgement";
import { User } from "@/models/User";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const user = await User.findById(session.user.id).select("plan planStatus trialEndsAt planCurrentPeriodEnd");
  if (!user || !hasBrokerAutomationAccess(user)) {
    return NextResponse.json({ error: "An active MT5 Broker subscription is required" }, { status: 403 });
  }
  const userId = session.user.id;
  const [events, acknowledgements] = await Promise.all([
    AutomationTradeEvent.find({ userId }).sort({ occurredAt: -1 }).limit(50)
      .select("signalId dealId brokerOrderId eventType symbol currency volume price netProfit occurredAt").lean(),
    EAcknowledgement.find({ userId }).sort({ createdAt: -1 }).limit(30)
      .select("signalId status details brokerOrderId createdAt").lean(),
  ]);
  return NextResponse.json({ events, acknowledgements }, { headers: { "Cache-Control": "no-store" } });
}
