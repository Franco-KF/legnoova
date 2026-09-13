import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export async function GET(req: Request) {
  try {
    const limited = rateLimitResponse(
      rateLimit(req, { key: "signals-market", limit: 60, windowMs: 60 * 1000 })
    );
    if (limited) return limited;

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      limit: url.searchParams.get("limit") || 50,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    await dbConnect();
    const docs = await Analysis.find({
      direction: { $ne: "neutral" },
      published: true,
      confidence: { $gte: 60 },
    })
      .sort({ createdAt: -1 })
      .limit(parsed.data.limit)
      .select("-userId")
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
      published: true,
      createdAt: (doc.createdAt as Date | undefined)?.toISOString?.() ?? null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Market signals error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}