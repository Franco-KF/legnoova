import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { analyzeChart, normalizeAnalysisError } from "@/lib/gemini";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import { User } from "@/models/User";
import { USAGE_LIMITS, FREE_ANALYSIS_LIMIT } from "@/config/plans";
import { notifySignalAlert } from "@/lib/signals/notify";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
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

    // Per-user limit (session-bound, protects the Gemini quota and cost).
    const limited = rateLimitResponse(
      rateLimit(req, {
        key: `analyze:${session.user.id}`,
        limit: 20,
        windowMs: 60 * 60 * 1000,
      })
    );
    if (limited) return limited;

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

    // Plan enforcement: free tier gets FREE_ANALYSIS_LIMIT per calendar
    // month; paid plans are metered against USAGE_LIMITS.
    await dbConnect();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [user, usedThisMonth] = await Promise.all([
      User.findById(session.user.id).select("plan planStatus planCurrentPeriodEnd"),
      Analysis.countDocuments({
        userId: session.user.id,
        createdAt: { $gte: monthStart },
      }),
    ]);

    let plan = user?.plan ?? null;
    // Expired canceled subscription: downgrade once the paid period ends.
    if (
      plan &&
      user?.planStatus === "canceled" &&
      user.planCurrentPeriodEnd &&
      user.planCurrentPeriodEnd <= now
    ) {
      plan = null;
    }

    const activePlan =
      plan && user?.planStatus !== "canceled" && user?.planStatus !== "past_due"
        ? plan
        : null;
    const limit = activePlan
      ? USAGE_LIMITS[activePlan]
      : FREE_ANALYSIS_LIMIT;

    if (usedThisMonth >= limit) {
      return NextResponse.json(
        {
          error: activePlan
            ? "You've reached your monthly analysis limit for your plan."
            : `You've used your ${FREE_ANALYSIS_LIMIT} free analyses this month. Upgrade to keep analysing.`,
          code: "plan_limit_reached",
          limit,
          used: usedThisMonth,
          plan: activePlan ?? "free",
        },
        { status: 402 }
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
    const isSignal = data.direction !== "neutral";
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
      signalStatus: "active",
      tookIt: "unset",
      published: isSignal && data.confidence >= 60,
    });

    // Fire-and-forget email alert when this signal matches a watchlist pair.
    if (isSignal) {
      notifySignalAlert({ userId: session.user.id, analysis: data }).catch(
        (error) => console.error("Signal alert error:", error)
      );
    }

    return NextResponse.json({
      analysis: {
        ...data,
        signalStatus: "active",
        tookIt: "unset",
        published: isSignal && data.confidence >= 60,
      },
      id: doc._id.toString(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      normalizeAnalysisError(error) ??
      (error instanceof Error &&
      /Mongo|mongoose|ECONNREFUSED|ServerSelection|DATABASE/i.test(error.message)
        ? "Database temporarily unavailable. Please try again in a minute."
        : "Analysis failed. Please ensure the chart is clear and try again.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
