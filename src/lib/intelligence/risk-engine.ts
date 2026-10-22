export interface MarketRegime {
  session: "asian" | "london" | "new-york" | "overlap" | "closed";
  volatility: "low" | "normal" | "high";
  spreadFactor: number;
}

export interface RiskCheckResult {
  allowed: boolean;
  riskPercent: number;
  maxLots: number;
  reason?: string;
  blockers: string[];
}

export interface PortfolioSnapshot {
  totalOpenPositions: number;
  totalFloatingProfit: number;
  sameSymbolPositions: number;
  sameDirectionPositions: number;
  correlationExposure: number; // 0-1
}

export interface DrawdownState {
  dailyLossPercent: number;
  equityDrawdownPercent: number;
  circuitBreaker: boolean;
}

export function getMarketRegime(serverHour: number): MarketRegime {
  // Approximate UTC hours for major FX sessions
  let session: MarketRegime["session"];
  if (serverHour >= 0 && serverHour < 8) session = "asian";
  else if (serverHour >= 8 && serverHour < 13) session = "london";
  else if (serverHour >= 13 && serverHour < 18) session = "new-york";
  else if (serverHour >= 13 && serverHour < 17) session = "overlap";
  else session = "closed";

  const volatility: MarketRegime["volatility"] =
    session === "overlap" ? "high" : session === "asian" ? "low" : "normal";

  const spreadFactor: MarketRegime["spreadFactor"] =
    session === "asian" ? 1.3 : session === "overlap" ? 0.9 : 1.0;

  return { session, volatility, spreadFactor };
}

export function computeAdaptiveRisk(
  baseRiskPercent: number,
  regime: MarketRegime,
  portfolio: PortfolioSnapshot,
  drawdown: DrawdownState,
  confidence: number,
  riskReward: number
): RiskCheckResult {
  const blockers: string[] = [];
  let riskPercent = baseRiskPercent;

  // Drawdown circuit breaker — halt new entries if daily loss exceeded
  if (drawdown.circuitBreaker) {
    return { allowed: false, riskPercent: 0, maxLots: 0, reason: "daily_loss_circuit_breaker", blockers: ["Daily loss limit reached — new entries paused"] };
  }

  // Equity drawdown guard
  if (drawdown.equityDrawdownPercent >= 10) {
    riskPercent *= 0.5;
    blockers.push("Equity drawdown ≥10% — risk halved");
  }
  if (drawdown.equityDrawdownPercent >= 20) {
    return { allowed: false, riskPercent: 0, maxLots: 0, reason: "equity_drawdown_circuit_breaker", blockers: ["Equity drawdown ≥20% — all entries paused"] };
  }

  // Session-based adjustment
  if (regime.session === "closed") {
    blockers.push("Outside major sessions — reduced liquidity");
    riskPercent *= 0.5;
  }
  if (regime.volatility === "high") {
    riskPercent *= 0.75;
    blockers.push("High volatility overlap — risk reduced 25%");
  }

  // Confidence-based scaling
  if (confidence < 75) {
    riskPercent *= 0.75;
    blockers.push("Confidence < 75 — risk reduced 25%");
  }
  if (confidence < 65) {
    return { allowed: false, riskPercent: 0, maxLots: 0, reason: "low_confidence", blockers: ["Confidence below entry threshold"] };
  }

  // Risk-reward filter
  if (riskReward < 1.5) {
    return { allowed: false, riskPercent: 0, maxLots: 0, reason: "insufficient_rr", blockers: ["Risk:reward below 1.5"] };
  }

  // Portfolio correlation guard
  if (portfolio.correlationExposure > 0.7) {
    blockers.push("High correlation exposure — risk reduced");
    riskPercent *= 0.5;
  }
  if (portfolio.sameSymbolPositions >= 2) {
    return { allowed: false, riskPercent: 0, maxLots: 0, reason: "symbol_exposure_cap", blockers: ["Already 2+ positions on same symbol"] };
  }
  if (portfolio.totalOpenPositions >= 5) {
    return { allowed: false, riskPercent: 0, maxLots: 0, reason: "position_count_cap", blockers: ["Maximum 5 concurrent positions"] };
  }

  // Floor risk at 0.01%
  riskPercent = Math.max(0.01, Math.round(riskPercent * 100) / 100);

  return {
    allowed: true,
    riskPercent,
    maxLots: 0, // computed by caller using volume step
    blockers,
  };
}

export function computePortfolioSnapshot(
  positions: Array<{ symbol: string; type: "buy" | "sell"; profit: number }>
): PortfolioSnapshot {
  const totalOpenPositions = positions.length;
  const totalFloatingProfit = positions.reduce((sum, p) => sum + p.profit, 0);
  const sameSymbolPositions = positions.length; // per-symbol computed by caller
  const sameDirectionPositions = positions.filter(p => p.type === "buy").length;
  const correlationExposure = Math.min(1, totalOpenPositions / 5);

  return {
    totalOpenPositions,
    totalFloatingProfit,
    sameSymbolPositions,
    sameDirectionPositions,
    correlationExposure,
  };
}

export function computeDrawdownState(
  balance: number,
  equity: number,
  dailyProfit: number,
  dailyLossLimitPercent: number = 0.5
): DrawdownState {
  const dailyLossPercent = balance > 0 ? Math.abs(Math.min(0, dailyProfit)) / balance * 100 : 0;
  const equityDrawdownPercent = balance > 0 ? Math.max(0, (balance - equity) / balance * 100) : 0;
  const circuitBreaker = dailyLossPercent >= dailyLossLimitPercent;

  return {
    dailyLossPercent,
    equityDrawdownPercent,
    circuitBreaker,
  };
}
