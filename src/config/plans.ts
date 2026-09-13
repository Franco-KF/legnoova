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
  /** Paddle price id (pri_...). Public identifier, resolved from env. */
  priceId?: string;
}

/**
 * Analyses per calendar month on the free tier (before upgrading).
 * Paid limits are effectively unmetered via USAGE_LIMITS.
 */
export const FREE_ANALYSIS_LIMIT = 10;

export const PLANS: Plan[] = [
  {
    id: "analyze",
    name: "Everything",
    price: 29,
    period: "/month",
    tagline: "Pro-grade Legnoova AI signals with full reasoning behind every level",
    highlight: false,
    features: [
      "Unlimited Legnoova AI chart analyses",
      "Structured signals with entry, stop-loss & targets",
      "Signal journal & hit-rate tracking (You vs Legnoova AI)",
      "Live signals feed + market signals",
      "Email alerts when signals match your watchlist",
      "All 7 trading strategies incl. Smart Money Concepts",
      "Multi-timeframe analysis",
      "Full analysis history & unlimited watchlists",
      "Priority processing",
    ],
    cta: "Start with $29/mo",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ANALYZE,
  },
  {
    id: "broker",
    name: "Everything + Broker",
    price: 59,
    period: "/month",
    tagline: "Signals plus direct broker connection for automated traders",
    highlight: true,
    features: [
      "Everything in the $29 plan",
      "Broker connection support",
      "Advanced automation & custom alerts",
      "Priority broker integration",
      "Dedicated support",
    ],
    cta: "Upgrade to $59/mo",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_BROKER,
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
