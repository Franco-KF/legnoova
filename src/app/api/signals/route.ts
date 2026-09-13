import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import { SIGNAL_STATUSES } from "@/lib/analysis/types";

const querySchema = z.object({
  status: z.enum(SIGNAL_STATUSES as [string, ...string[]]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      status: url.searchParams.get("status") || undefined,
      limit: url.searchParams.get("limit") || 50,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    await dbConnect();
    const filter: Record<string, unknown> = {
      userId: session.user.id,
      direction: { $ne: "neutral" },
    };
    if (parsed.data.status) filter.signalStatus = parsed.data.status;

    const docs = await Analysis.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsed.data.limit)
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
      riskReward: doc.riskReward,
      confidence: doc.confidence,
      strategy: doc.strategy,
      summary: doc.summary,
      keyFindings: doc.keyFindings || [],
      strategyChecklist: doc.strategyChecklist || [],
      keyLevels: doc.keyLevels || { support: [], resistance: [] },
      strategyAssessments: doc.strategyAssessments || [],
      signalStatus: doc.signalStatus || "active",
      tookIt: doc.tookIt || "unset",
      published: !!doc.published,
      createdAt: (doc.createdAt as Date | undefined)?.toISOString?.() ?? null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Signals error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}