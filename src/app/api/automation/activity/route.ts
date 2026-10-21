import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { AutomationTradeEvent } from "@/models/AutomationTradeEvent";
import { EAcknowledgement } from "@/models/EAcknowledgement";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const userId = session.user.id;
  const [events, acknowledgements] = await Promise.all([
    AutomationTradeEvent.find({ userId }).sort({ occurredAt: -1 }).limit(50)
      .select("signalId dealId brokerOrderId eventType symbol currency volume price netProfit occurredAt").lean(),
    EAcknowledgement.find({ userId }).sort({ createdAt: -1 }).limit(30)
      .select("signalId status details brokerOrderId createdAt").lean(),
  ]);
  return NextResponse.json({ events, acknowledgements }, { headers: { "Cache-Control": "no-store" } });
}
