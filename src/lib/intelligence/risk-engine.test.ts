import { describe, it, expect } from "vitest";
import {
  computeAdaptiveRisk,
  computePortfolioSnapshot,
  computeDrawdownState,
  getMarketRegime,
} from "@/lib/intelligence/risk-engine";
import type { MarketRegime, PortfolioSnapshot, DrawdownState } from "@/lib/intelligence/risk-engine";

describe("getMarketRegime", () => {
  it("identifies asian session", () => {
    const regime = getMarketRegime(4);
    expect(regime.session).toBe("asian");
    expect(regime.volatility).toBe("low");
    expect(regime.spreadFactor).toBe(1.3);
  });

  it("identifies london session", () => {
    const regime = getMarketRegime(10);
    expect(regime.session).toBe("london");
    expect(regime.volatility).toBe("normal");
    expect(regime.spreadFactor).toBe(1.0);
  });

  it("identifies new-york session", () => {
    const regime = getMarketRegime(15);
    expect(regime.session).toBe("new-york");
    expect(regime.volatility).toBe("normal");
  });

  it("identifies closed session", () => {
    const regime = getMarketRegime(22);
    expect(regime.session).toBe("closed");
    expect(regime.spreadFactor).toBe(1.0);
  });

  it("closed session reduces risk multiplier", () => {
    const regime = getMarketRegime(23);
    expect(regime.session).toBe("closed");
  });
});

describe("computeDrawdownState", () => {
  it("calculates daily loss and equity drawdown", () => {
    const state = computeDrawdownState(10000, 9500, -200, 0.5);
    expect(state.dailyLossPercent).toBe(2);
    expect(state.equityDrawdownPercent).toBe(5);
    // 2% daily loss >= 0.5% limit, so circuit breaker IS triggered
    expect(state.circuitBreaker).toBe(true);
  });

  it("no circuit breaker when daily loss under limit", () => {
    const state = computeDrawdownState(10000, 9900, -20, 0.5);
    expect(state.dailyLossPercent).toBe(0.2);
    expect(state.circuitBreaker).toBe(false);
  });

  it("handles zero balance", () => {
    const state = computeDrawdownState(0, 0, 0, 0.5);
    expect(state.dailyLossPercent).toBe(0);
    expect(state.equityDrawdownPercent).toBe(0);
    expect(state.circuitBreaker).toBe(false);
  });

  it("equity above balance gives no drawdown", () => {
    const state = computeDrawdownState(10000, 10500, 100, 0.5);
    expect(state.equityDrawdownPercent).toBe(0);
    expect(state.dailyLossPercent).toBe(0);
  });
});

describe("computePortfolioSnapshot", () => {
  it("computes portfolio metrics", () => {
    const positions = [
      { symbol: "EURUSD", type: "buy" as const, profit: 50 },
      { symbol: "EURUSD", type: "buy" as const, profit: -30 },
      { symbol: "GBPUSD", type: "sell" as const, profit: 20 },
    ];
    const snapshot = computePortfolioSnapshot(positions);
    expect(snapshot.totalOpenPositions).toBe(3);
    expect(snapshot.totalFloatingProfit).toBe(40);
    expect(snapshot.correlationExposure).toBe(0.6); // 3/5
  });

  it("handles empty positions", () => {
    const snapshot = computePortfolioSnapshot([]);
    expect(snapshot.totalOpenPositions).toBe(0);
    expect(snapshot.totalFloatingProfit).toBe(0);
    expect(snapshot.correlationExposure).toBe(0);
  });
});

describe("computeAdaptiveRisk", () => {
  const baseRegime: MarketRegime = {
    session: "london",
    volatility: "normal",
    spreadFactor: 1.0,
  };

  const basePortfolio: PortfolioSnapshot = {
    totalOpenPositions: 0,
    totalFloatingProfit: 0,
    sameSymbolPositions: 0,
    sameDirectionPositions: 0,
    correlationExposure: 0,
  };

  const baseDrawdown: DrawdownState = {
    dailyLossPercent: 0,
    equityDrawdownPercent: 0,
    circuitBreaker: false,
  };

  it("allows normal risk entry", () => {
    const result = computeAdaptiveRisk(0.5, baseRegime, basePortfolio, baseDrawdown, 80, 2.0);
    expect(result.allowed).toBe(true);
    expect(result.riskPercent).toBe(0.5);
    expect(result.blockers.length).toBe(0);
  });

  it("blocks when circuit breaker active", () => {
    const result = computeAdaptiveRisk(
      0.5,
      baseRegime,
      basePortfolio,
      { ...baseDrawdown, circuitBreaker: true },
      80,
      2.0
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("daily_loss_circuit_breaker");
  });

  it("blocks when equity drawdown >= 20%", () => {
    const result = computeAdaptiveRisk(
      0.5,
      baseRegime,
      basePortfolio,
      { ...baseDrawdown, equityDrawdownPercent: 25 },
      80,
      2.0
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("equity_drawdown_circuit_breaker");
  });

  it("blocks when confidence < 65", () => {
    const result = computeAdaptiveRisk(0.5, baseRegime, basePortfolio, baseDrawdown, 60, 2.0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("low_confidence");
  });

  it("blocks when risk:reward < 1.5", () => {
    const result = computeAdaptiveRisk(0.5, baseRegime, basePortfolio, baseDrawdown, 80, 1.0);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("insufficient_rr");
  });

  it("blocks when 5+ positions open", () => {
    const result = computeAdaptiveRisk(
      0.5,
      baseRegime,
      { ...basePortfolio, totalOpenPositions: 5 },
      baseDrawdown,
      80,
      2.0
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("position_count_cap");
  });

  it("reduces risk in closed session", () => {
    const result = computeAdaptiveRisk(
      0.5,
      { ...baseRegime, session: "closed" },
      basePortfolio,
      baseDrawdown,
      80,
      2.0
    );
    expect(result.allowed).toBe(true);
    expect(result.riskPercent).toBe(0.25); // 0.5 * 0.5
  });

  it("reduces risk in high volatility", () => {
    const result = computeAdaptiveRisk(
      0.5,
      { ...baseRegime, volatility: "high" },
      basePortfolio,
      baseDrawdown,
      80,
      2.0
    );
    expect(result.riskPercent).toBeCloseTo(0.38, 1); // 0.5 * 0.75 = 0.375, rounded to 0.38
  });

  it("reduces risk for confidence < 75", () => {
    const result = computeAdaptiveRisk(0.5, baseRegime, basePortfolio, baseDrawdown, 70, 2.0);
    expect(result.riskPercent).toBeCloseTo(0.38, 1); // 0.5 * 0.75 = 0.375, rounded to 0.38
  });

  it("blocks same symbol when 2+ positions", () => {
    const result = computeAdaptiveRisk(
      0.5,
      baseRegime,
      { ...basePortfolio, sameSymbolPositions: 2 },
      baseDrawdown,
      80,
      2.0
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("symbol_exposure_cap");
  });

  it("reduces risk for high correlation", () => {
    const result = computeAdaptiveRisk(
      0.5,
      baseRegime,
      { ...basePortfolio, correlationExposure: 0.8 },
      baseDrawdown,
      80,
      2.0
    );
    expect(result.riskPercent).toBe(0.25); // 0.5 * 0.5
  });

  it("floors risk at 0.01%", () => {
    const result = computeAdaptiveRisk(
      0.01,
      { ...baseRegime, session: "closed", volatility: "high" },
      basePortfolio,
      baseDrawdown,
      70,
      2.0
    );
    expect(result.riskPercent).toBeGreaterThanOrEqual(0.01);
  });

  it("returns blockers list", () => {
    const result = computeAdaptiveRisk(
      0.5,
      { ...baseRegime, session: "closed" },
      basePortfolio,
      baseDrawdown,
      70,
      2.0
    );
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers.some((b) => b.includes("Outside"))).toBe(true);
    expect(result.blockers.some((b) => b.includes("Confidence"))).toBe(true);
  });

  it("combines multiple risk reductions", () => {
    const result = computeAdaptiveRisk(
      0.5,
      { ...baseRegime, session: "closed", volatility: "high" },
      basePortfolio,
      baseDrawdown,
      70,
      2.0
    );
    // 0.5 * 0.5 (closed) * 0.75 (high vol) * 0.75 (conf < 75) = 0.140625, rounded to 0.14
    expect(result.riskPercent).toBeCloseTo(0.14, 1);
  });
});
