import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import mongoose from "mongoose";
import { aiResilience } from "@/lib/resilience/ai-fallback";
import { getBreakerState } from "@/lib/resilience/circuit-breaker";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, { status: "healthy" | "degraded" | "unhealthy"; latencyMs?: number; detail?: string }> = {};
  let overall: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Database health
  const dbStart = Date.now();
  try {
    await dbConnect();
    const dbLatency = Date.now() - dbStart;
    checks.database = {
      status: mongoose.connection.readyState === 1 ? "healthy" : "degraded",
      latencyMs: dbLatency,
      detail: `MongoDB readyState=${mongoose.connection.readyState}`,
    };
    if (checks.database.status !== "healthy") overall = "degraded";
  } catch (error) {
    checks.database = { status: "unhealthy", detail: error instanceof Error ? error.message : "unknown" };
    overall = "unhealthy";
  }

  // AI service health
  const aiStatus = aiResilience.getStatus();
  checks.ai = {
    status: aiStatus.circuitState === "open" ? "unhealthy" : aiStatus.lastFailure && Date.now() - aiStatus.lastFailure < 300_000 ? "degraded" : "healthy",
    detail: `primary=${aiStatus.primary} fallback=${aiStatus.fallback ?? "none"} circuit=${aiStatus.circuitState}`,
  };
  if (checks.ai.status === "unhealthy") overall = "unhealthy";
  else if (checks.ai.status === "degraded" && overall === "healthy") overall = "degraded";

  // MT5 breaker state
  const mt5Breaker = getBreakerState("mt5-api");
  checks.mt5 = {
    status: mt5Breaker === "open" ? "degraded" : mt5Breaker === null ? "healthy" : "healthy",
    detail: `circuit=${mt5Breaker ?? "closed"}`,
  };

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: checks,
    ai: aiStatus,
  }, { headers: { "Cache-Control": "no-store" } });
}
