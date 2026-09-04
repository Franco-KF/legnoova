import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const docs = await Analysis.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const items = docs.map((doc) => ({
      id: doc._id.toString(),
      pair: doc.pair,
      symbol: doc.symbol,
      timeframe: doc.timeframe,
      direction: doc.direction,
      entryPrice: doc.entryPrice,
      stopLoss: doc.stopLoss,
      takeProfits: doc.takeProfits,
      confidence: doc.confidence,
      strategy: doc.strategy,
      summary: doc.summary,
      riskReward: doc.riskReward,
      createdAt: (doc.createdAt as Date | undefined)?.toISOString?.() ?? null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
