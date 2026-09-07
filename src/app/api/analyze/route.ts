import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { analyzeChart } from "@/lib/gemini";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import {
  STRATEGIES,
  TIMEFRAMES,
  type Analysis as AnalysisType,
} from "@/lib/analysis/types";

const analyzeSchema = z.object({
  image: z.string().min(1, "Image data is required"),
  mimeType: z
    .string()
    .regex(
      /^image\/(png|jpe?g|webp|gif)$/i,
      "Only PNG, JPEG, WEBP or GIF images are supported"
    ),
  symbolHint: z.string().trim().max(20).optional().default(""),
  timeframe: z
    .enum(TIMEFRAMES.map((t) => t.id) as [string, ...string[]])
    .default("H1"),
  strategy: z
    .enum(STRATEGIES.map((s) => s.id) as [string, ...string[]])
    .default("all"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Guard: image should be base64 and not absurdly large
    if (parsed.data.image.length > 12_000_000) {
      return NextResponse.json(
        { error: "Image is too large (max ~9MB)" },
        { status: 413 }
      );
    }

    const analysis = await analyzeChart({
      imageBase64: parsed.data.image,
      mimeType: parsed.data.mimeType,
      symbolHint: parsed.data.symbolHint,
      timeframe: parsed.data.timeframe,
      strategy: parsed.data.strategy,
    });

    const data: AnalysisType = analysis;

    await dbConnect();
    const doc = await Analysis.create({
      userId: session.user.id,
      pair: data.pair,
      symbol: data.symbol,
      timeframe: data.timeframe,
      direction: data.direction,
      entryPrice: data.entryPrice,
      stopLoss: data.stopLoss,
      takeProfits: data.takeProfits,
      riskReward: data.riskReward,
      confidence: data.confidence,
      strategy: data.strategy,
      summary: data.summary,
      keyLevels: data.keyLevels,
      strategyAssessments: data.strategyAssessments || [],
      keyFindings: data.keyFindings || [],
      strategyChecklist: data.strategyChecklist || [],
      riskDisclosure: data.riskDisclosure,
    });

    return NextResponse.json({
      analysis: data,
      id: doc._id.toString(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error && error.message === "GEMINI_API_KEY is not configured"
        ? "AI service is not configured yet"
        : "Analysis failed. Please ensure the chart is clear and try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
