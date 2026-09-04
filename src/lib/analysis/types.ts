export const STRATEGIES = [
  { id: "price-action", label: "Price Action" },
  { id: "market-structure", label: "Market Structure" },
  { id: "trend-following", label: "Trend Following" },
  { id: "support-resistance", label: "Support & Resistance" },
  { id: "breakout", label: "Breakout" },
  { id: "supply-demand", label: "Supply & Demand" },
  { id: "all", label: "Consensus — All Strategies" },
] as const;

export type StrategyId = (typeof STRATEGIES)[number]["id"];

export const TIMEFRAMES = [
  { id: "M1", label: "M1" },
  { id: "M5", label: "M5" },
  { id: "M15", label: "M15" },
  { id: "M30", label: "M30" },
  { id: "H1", label: "H1" },
  { id: "H4", label: "H4" },
  { id: "D1", label: "D1" },
  { id: "W1", label: "W1" },
  { id: "MN", label: "MN" },
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number]["id"];

export type SignalSide = "buy" | "sell" | "neutral";

export interface TakeProfit {
  price: number;
  label: "TP1" | "TP2" | "TP3";
  riskReward: number;
  explanation: string;
}

export interface StrategyAssessment {
  strategyId: string;
  verdict: "bullish" | "bearish" | "neutral";
  confidence: number;
  note: string;
}

export interface Analysis {
  symbol: string;
  pair: string;
  timeframe: string;
  direction: "buy" | "sell" | "neutral";
  entryPrice: number;
  stopLoss: number;
  takeProfits: TakeProfit[];
  riskReward: number;
  confidence: number;
  strategy: string;
  summary: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  strategyAssessments?: StrategyAssessment[];
  riskDisclosure: string;
}

export const SAMPLE_ANALYSIS: Analysis = {
  symbol: "EURUSD",
  pair: "EUR/USD",
  timeframe: "H1",
  direction: "buy",
  entryPrice: 1.0845,
  stopLoss: 1.0795,
  takeProfits: [
    {
      price: 1.0895,
      label: "TP1",
      riskReward: 1.0,
      explanation: "Nearest resistance — take partial profit and move SL to break-even.",
    },
    {
      price: 1.0945,
      label: "TP2",
      riskReward: 2.0,
      explanation: "Major supply zone — second target for the remaining position.",
    },
  ],
  riskReward: 2.0,
  confidence: 78,
  strategy: "Consensus — All Strategies",
  summary:
    "Price is holding above a strong demand zone with clear higher highs and higher lows. Momentum favours continuation toward the next supply area.",
  keyLevels: {
    support: [1.0795, 1.0760],
    resistance: [1.0895, 1.0945],
  },
  riskDisclosure:
    "AI-generated analysis is for informational purposes only and does not constitute financial advice.",
};
