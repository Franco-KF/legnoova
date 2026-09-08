export type PlanId = "analyze" | "broker";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  tagline: string;
  highlight: boolean;
  features: string[];
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "analyze",
    name: "Everything",
    price: 29,
    period: "/month",
    tagline: "Complete Legnoova AI chart analysis for serious traders",
    highlight: false,
    features: [
      "Unlimited Legnoova AI chart analyses",
      "All 7 trading strategies incl. Smart Money Concepts",
      "Multi-timeframe analysis",
      "Advanced risk analysis",
      "Full analysis history",
      "Unlimited watchlists",
      "Priority processing",
    ],
    cta: "Start with $29/mo",
  },
  {
    id: "broker",
    name: "Everything + Broker",
    price: 59,
    period: "/month",
    tagline: "Analysis plus direct broker connection",
    highlight: true,
    features: [
      "Everything in the $29 plan",
      "Broker connection support",
      "Advanced automation",
      "Priority broker integration",
      "Dedicated support",
    ],
    cta: "Upgrade to $59/mo",
  },
];

export const STRATEGY_WEIGHTS = {
  "price-action": 20,
  "market-structure": 20,
  "trend-following": 15,
  "support-resistance": 15,
  breakout: 15,
  "supply-demand": 15,
} as const;

export const CONSENSUS_THRESHOLDS = {
  strongBuy: 80,
  buy: 65,
  sell: 65,
  strongSell: 80,
} as const;

export const USAGE_LIMITS: Record<PlanId, number> = {
  analyze: 1000,
  broker: 1000,
};
