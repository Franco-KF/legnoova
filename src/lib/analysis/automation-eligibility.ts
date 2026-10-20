import type { Analysis } from "@/lib/analysis/types";

/**
 * Conservative mechanical gate for the MT5 queue. Passing this gate is not a
 * prediction of profitability or a statistically verified win rate.
 */
export function isAutomationEligible(strategyId: string, analysis: Analysis): boolean {
  if (strategyId !== "automation-confluence") return false;
  if (analysis.direction === "neutral" || !analysis.targetsVisible) return false;
  if (analysis.confidence < 75 || analysis.riskReward < 1.5) return false;
  if (!analysis.takeProfits.some((target) => target.riskReward >= 1.5)) return false;

  const confirmed = analysis.strategyChecklist?.filter((item) => item.status === "confirmed").length ?? 0;
  const failed = analysis.strategyChecklist?.filter((item) => item.status === "failed").length ?? 0;
  if (confirmed < 4 || failed > 0) return false;

  const alignedVerdict = analysis.direction === "buy" ? "bullish" : "bearish";
  const opposingVerdict = analysis.direction === "buy" ? "bearish" : "bullish";
  const aligned = new Set(
    analysis.strategyAssessments
      ?.filter((assessment) => assessment.verdict === alignedVerdict && assessment.confidence >= 65)
      .map((assessment) => assessment.strategyId) ?? []
  );
  const strongOpposition = analysis.strategyAssessments?.some(
    (assessment) => assessment.verdict === opposingVerdict && assessment.confidence >= 80
  ) ?? false;

  return aligned.size >= 2 && !strongOpposition;
}
