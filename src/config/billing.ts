/**
 * Single source of truth for the subscription promise.
 *
 * Every trial, guarantee and cancellation claim rendered anywhere on the
 * platform must read from here so the marketing site, the app, checkout and
 * the legal pages can never drift out of sync.
 */
export const TRIAL_DAYS = 7;

/**
 * Money-back guarantee window, measured from the first successful charge
 * (i.e. the day the free trial ends). Cancel inside this window and the
 * charge is refunded in full — no questions asked.
 */
export const MONEY_BACK_DAYS = 14;

export const BILLING_POLICY = {
  trialDays: TRIAL_DAYS,
  moneyBackDays: MONEY_BACK_DAYS,
  renewalPeriod: "monthly",
  cancelAnytime: true,
} as const;

/** Short, reusable labels so the wording is identical across the product. */
export const BILLING_COPY = {
  trial: `${TRIAL_DAYS}-day free trial`,
  trialFull: `${TRIAL_DAYS}-day free trial, no charge until it ends`,
  moneyBack: `${MONEY_BACK_DAYS}-day money-back guarantee`,
  cancel: "Cancel anytime",
  cancelFull: "Cancel anytime — your access runs to the end of the billing period",
  renewal: "Auto-renews monthly. Cancel anytime.",
} as const;

/** Shared toast copy for the payment / checkout flow. */
export const PAYMENT_FAILED_COPY = {
  title: "Payment failed",
  description: "Your card was not charged. Please try again.",
} as const;

/** Shown after a successful checkout that starts the free trial. */
export const TRIAL_STARTED_COPY = {
  title: "Your free trial has started!",
  description: `No charge today. We'll remind you before your ${TRIAL_DAYS}-day trial ends.`,
} as const;

/** Shown after a payment method is saved successfully. */
export const CARD_SAVED_COPY = {
  title: "Card saved",
  description: "Your card is now on file.",
} as const;

/** Shown when a payment method could not be saved. */
export const CARD_SAVE_FAILED_COPY = {
  title: "Couldn't save your card",
  description: "Please check your details and try again.",
} as const;

/** Card-on-file requirements are processor-driven; keep it in one place. */
export const TRIAL_REQUIRES_CARD = true;

/** Returns the timestamp `trialDays` from the given start (default: now). */
export function getTrialEnd(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

/** Whole days remaining until `date`, floored at zero. */
export function daysRemaining(date: Date | string | null | undefined): number {
  if (!date) return 0;
  const end = typeof date === "string" ? new Date(date) : date;
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
