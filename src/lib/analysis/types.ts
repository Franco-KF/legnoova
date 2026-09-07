export type ChecklistStatus = "confirmed" | "partial" | "failed";

export interface StrategyChecklistItem {
  point: string;
  status: ChecklistStatus;
  note: string;
}

export type FindingTone = "bullish" | "bearish" | "neutral";

export interface KeyFinding {
  label: string;
  value: string;
  tone: FindingTone;
}

export interface StrategyDef {
  id: string;
  label: string;
  short: string;
  tagline: string;
  description: string;
  /** What the AI must evaluate — rendered in the UI and injected into the prompt. */
  checklist: string[];
  /** Extra model instructions for this strategy. */
  promptFocus: string;
}

export const STRATEGIES: StrategyDef[] = [
  {
    id: "price-action",
    label: "Price Action",
    short: "PA",
    tagline: "Candles, swings & rejection",
    description:
      "Reads raw candle behaviour — pin bars, engulfing candles, rejection wicks and swing failure — to time entries without indicators.",
    checklist: [
      "Swing highs / lows mapped",
      "Candle rejection signals",
      "Momentum of last candles",
      "Clean entry trigger",
    ],
    promptFocus:
      "Prioritise raw candle behaviour: pin bars, engulfing patterns, rejection wicks, inside/outside bars and the momentum of the most recent candles. The entry must be anchored to an actionable candle signal or swing level, not an indicator.",
  },
  {
    id: "market-structure",
    label: "Market Structure",
    short: "MS",
    tagline: "HH/HL vs LH/LL",
    description:
      "Trades with the prevailing structure — higher highs & higher lows for bullish, lower highs & lower lows for bearish — and flags structure breaks.",
    checklist: [
      "Trend direction from swings",
      "Higher highs / lower lows sequence",
      "Structure break or respect",
      "Trendline / channel validity",
    ],
    promptFocus:
      "Map the swing sequence explicitly (HH/HL vs LH/LL). State whether structure is intact or has just broken. Entries must respect the dominant structure — pullbacks into structure in trend direction, or confirmed breaks with retest.",
  },
  {
    id: "trend-following",
    label: "Trend Following",
    short: "TF",
    tagline: "Momentum & continuation",
    description:
      "Identifies an established trend and looks for low-risk continuation entries on pullbacks, with targets at measured extensions.",
    checklist: [
      "Established trend identified",
      "Pullback quality",
      "Continuation trigger",
      "Room to next structural target",
    ],
    promptFocus:
      "Only trade continuation. Confirm an established trend first, then find the highest-quality pullback and its resumption trigger. If the chart is ranging or the trend is exhausted (climax, divergence between swings), return neutral.",
  },
  {
    id: "support-resistance",
    label: "Support & Resistance",
    short: "S&R",
    tagline: "Tested horizontal levels",
    description:
      "Anchors every decision to horizontal levels the market has tested multiple times — bounces at support, rejections at resistance, or clean breakouts.",
    checklist: [
      "Tested horizontal levels marked",
      "Number of touches counted",
      "Role flip (support ↔ resistance)",
      "Reaction quality at level",
    ],
    promptFocus:
      "Identify the horizontal levels with the most historical touches and strongest reactions. State how many times each key level was tested and whether an old support has flipped to resistance (or vice versa). Entries must sit at a level, never mid-range.",
  },
  {
    id: "breakout",
    label: "Breakout",
    short: "BO",
    tagline: "Range & compression escapes",
    description:
      "Watches for price escaping a range, triangle or consolidation with momentum, then targets the measured move of the pattern.",
    checklist: [
      "Range / pattern boundary defined",
      "Breakout candle strength",
      "Retest or continuation",
      "Measured-move target",
    ],
    promptFocus:
      "Define the range or compressing pattern first. Judge whether the breakout candle closes decisively outside it (strong body, low wick overlap) or is a fakeout. Prefer entries on the retest of the broken boundary; target the measured move of the pattern height.",
  },
  {
    id: "supply-demand",
    label: "Supply & Demand",
    short: "S&D",
    tagline: "Imbalance origin zones",
    description:
      "Finds the zones where sharp moves originated — fresh supply and demand — and trades the first return to them.",
    checklist: [
      "Origin zone of impulsive move",
      "Zone freshness (first retest?)",
      "Impulse strength out of zone",
      "Risk anchored beyond zone",
    ],
    promptFocus:
      "Locate the base candles that launched the most impulsive moves and mark them as supply/demand zones. Rank zone freshness (fresh/untested zones are strongest). Entry goes at the edge of the zone with the stop beyond the zone, not at an arbitrary distance.",
  },
  {
    id: "smc",
    label: "Smart Money Concepts",
    short: "SMC",
    tagline: "Liquidity, order blocks & FVGs",
    description:
      "Institutional-style read: break of structure (BOS) and change of character (CHoCH), order blocks, fair value gaps, liquidity sweeps and premium/discount pricing.",
    checklist: [
      "Structure: BOS vs CHoCH",
      "Order block identified",
      "Fair value gap (imbalance)",
      "Liquidity sweep / stop hunt",
      "Premium vs discount zone",
    ],
    promptFocus: `Apply full Smart Money Concepts methodology:
- Structure: determine the dealing range. Label the most recent structural event as BOS (continuation) or CHoCH (potential reversal) and give the exact price it happened at.
- Order blocks: find the last opposing candle before each impulsive displacement. Mark the strongest unmitigated bullish OB (for buys) or bearish OB (for sells) with its price range.
- Fair Value Gaps: identify 3-candle imbalances (gap between wick 1 and wick 3) that price is likely to rebalance; entries may target the FVG midpoint (consequent encroachment).
- Liquidity: note where equal highs/lows or obvious stop clusters sit, and whether a liquidity sweep/stop hunt has just occurred. The ideal entry follows a sweep of liquidity into an OB or FVG.
- Premium/Discount: locate the 50% equilibrium of the dealing range. Longs are only valid in the discount half, shorts only in the premium half — say which half price is in.
The entry must be justified by at least an OB or FVG, with the stop placed beyond the swept liquidity or the order block, never at an arbitrary distance.`,
  },
  {
    id: "all",
    label: "Consensus — All Strategies",
    short: "ALL",
    tagline: "Every lens, one verdict",
    description:
      "Runs the full playbook — price action, structure, trend, levels, breakouts, supply & demand and smart money concepts — and returns one consensus verdict with per-strategy confidence.",
    checklist: [
      "Multi-strategy confluence",
      "Conflicting signals resolved",
      "Highest-weight evidence chosen",
      "Consensus confidence scored",
    ],
    promptFocus:
      "Evaluate the chart through price action, market structure, trend, support/resistance, breakout and supply/demand AND smart money concepts (order blocks, FVGs, liquidity, premium/discount). Fill strategyChecklist with the items provided and also return strategyAssessments scoring each strategy separately. The final direction must be the highest-confluence verdict; if lenses conflict strongly, return neutral.",
  },
];

export type StrategyId = (typeof STRATEGIES)[number]["id"];

export function getStrategy(id: string): StrategyDef {
  return STRATEGIES.find((s) => s.id === id) || STRATEGIES[STRATEGIES.length - 1];
}

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
  /** Strategy-specific evidence produced by the AI (dynamic per strategy). */
  keyFindings?: KeyFinding[];
  /** Per-point evaluation of the chosen strategy's checklist. */
  strategyChecklist?: StrategyChecklistItem[];
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
