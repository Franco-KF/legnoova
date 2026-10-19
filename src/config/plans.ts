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
    name: "Forex Essentials",
    price: 29,
    period: "/month",
    tagline: "Chart reviews, signals and tools—all in one place",
    highlight: false,
    trialDays: TRIAL_DAYS,
    features: [
      "Up to 1,000 Legnoova AI chart analyses per month",
      "Clear signal with possible entry, stop and targets",
      "Trade journal to track your choices and results",
      "Live signals and market updates",
      "Email alerts for the pairs you follow",
      "Seven ways to read the chart",
      "Compare short- and long-term views",
      "Past chart reviews and watchlists",
      "Faster chart reviews",
    ],
    cta: `Start ${TRIAL_DAYS}-day free trial`,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ANALYZE,
  },
  {
    id: "broker",
    name: "Forex Essentials + Broker Tools",
    price: 59,
    period: "/month",
    tagline: "Everything in the $29 plan, plus broker links and automated trade execution",
    highlight: true,
    trialDays: TRIAL_DAYS,
    note: "Automate your broker workflow while keeping control of your trading plan.",
    features: [
      "Everything in the $29 plan",
      "Connect your broker and automate trade execution",
      "Set your risk rules and custom trade alerts",
    ],
    cta: `Start ${TRIAL_DAYS}-day free trial`,
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_BROKER,
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export const PLAN_BADGES: Record<PlanId, string> = {
  analyze: "Forex Essentials",
  broker: "Forex Essentials + Broker Tools",
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
