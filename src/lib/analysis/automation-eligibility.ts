import type { Analysis } from "@/lib/analysis/types";

/**
 * Conservative mechanical gate for the MT5 queue. Passing this gate is not a
 * prediction of profitability or a statistically verified win rate.
 */
export function isAutomationEligible(strategyId: string, timeframe: string, analysis: Analysis): boolean {
  if (strategyId !== "automation-confluence" && strategyId !== "scalping-confluence") return false;
  const scalping = strategyId === "scalping-confluence";
  if (scalping && timeframe !== "M1") return false;
  if (analysis.direction === "neutral" || !analysis.targetsVisible) return false;
  const minimumRiskReward = scalping ? 1.2 : 1.5;
  const minimumConfidence = scalping ? 70 : 75;
  if (analysis.confidence < minimumConfidence || analysis.riskReward < minimumRiskReward) return false;
  if (!analysis.takeProfits.some((target) => target.riskReward >= minimumRiskReward)) return false;

  const confirmed = analysis.strategyChecklist?.filter((item) => item.status === "confirmed").length ?? 0;
  const failed = analysis.strategyChecklist?.filter((item) => item.status === "failed").length ?? 0;
  if (confirmed < 4 || failed > 0) return false;

  const alignedVerdict = analysis.direction === "buy" ? "bullish" : "bearish";
  const opposingVerdict = analysis.direction === "buy" ? "bearish" : "bullish";
  const aligned = new Set(
    analysis.strategyAssessments
      ?.filter((assessment) => assessment.verdict === alignedVerdict && assessment.confidence >= (scalping ? 70 : 65))
      .map((assessment) => assessment.strategyId) ?? []
  );
  const strongOpposition = analysis.strategyAssessments?.some(
    (assessment) => assessment.verdict === opposingVerdict && assessment.confidence >= (scalping ? 85 : 80)
  ) ?? false;

  return aligned.size >= (scalping ? 1 : 2) && !strongOpposition;
}
