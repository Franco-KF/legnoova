import { TRIAL_DAYS } from "./billing";

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
  /** Length of the free trial in days before the first charge. */
  trialDays: number;
  /** Optional marketing note shown on the public pricing cards. */
  note?: string;
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
    name: "Forex Trader Toolkit",
    price: 29,
    period: "/month",
    tagline: "Chart analysis and the core forex trading services in one subscription",
    highlight: false,
    trialDays: TRIAL_DAYS,
    features: [
      "Up to 1,000 Legnoova AI chart analyses per month",
      "Structured signals with entry, stop-loss & targets",
      "Signal journal & hit-rate tracking (You vs Legnoova AI)",
      "Live signals feed + market signals",
      "Email alerts when signals match your watchlist",
      "All 7 trading strategies incl. Smart Money Concepts",
      "Multi-timeframe analysis",
      "Full analysis history & unlimited watchlists",
      "Priority processing",
    ],
    cta: `Start ${TRIAL_DAYS}-day free trial`,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ANALYZE,
  },
  {
    id: "broker",
    name: "Toolkit + Broker Automation",
    price: 59,
    period: "/month",
    tagline: "Everything in the $29 plan, with broker automation in active development",
    highlight: true,
    trialDays: TRIAL_DAYS,
    note: "Broker connection and automated execution are the next implementation focus.",
    features: [
      "Everything in the $29 plan",
      "Broker connection and automated execution (in development)",
      "Automation settings and custom alerts (in development)",
    ],
    cta: `Start ${TRIAL_DAYS}-day free trial`,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_BROKER,
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export const PLAN_BADGES: Record<PlanId, string> = {
  analyze: "Forex Trader Toolkit",
  broker: "Toolkit + Broker Automation",
};

export const STRATEGY_WEIGHTS = {
  "price-action": 20,
  "market-structure": 20,
  "trend-following": 15,
  "support-resistance": 15,
  breakout: 10,
  "supply-demand": 10,
  smc: 10,
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
