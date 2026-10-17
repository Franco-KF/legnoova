"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, FREE_ANALYSIS_LIMIT } from "@/config/plans";
import { MONEY_BACK_DAYS, TRIAL_DAYS, daysRemaining } from "@/config/billing";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CreditCard,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMethodForm } from "@/components/billing/payment-method-form";
import { PageHeader } from "@/components/layout/page-header";

interface AccountData {
  plan: string | null;
  planStatus: string | null;
  trialEndsAt: string | null;
  planCurrentPeriodEnd: string | null;
}

interface SavedMethod {
  id: string;
  brand: string;
  cardNumber: string | null;
  expMonth: number;
  expYear: number;
  name: string | null;
  isDefault: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  analyze: "Everything · $29/mo",
  broker: "Everything + Broker · $59/mo",
};

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unknown: "Card",
};

function formatCardNumber(digits: string): string {
  return digits.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
}

async function fetchAccount(): Promise<AccountData | null> {
  try {
    const res = await fetch("/api/account");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [methods, setMethods] = useState<SavedMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  const refresh = useCallback(() => {
    void fetchAccount().then((user) => {
      if (user) setAccount(user);
    });
  }, []);

  const loadMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/payment-methods");
      if (!res.ok) return;
      const data = await res.json();
      setMethods(data.methods ?? []);
    } catch {
      /* keep page resilient */
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAccount().then((user) => {
      if (active && user) setAccount(user);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/billing/payment-methods");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setMethods(data.methods ?? []);
      } catch {
        /* keep page resilient */
      } finally {
        if (active) setLoadingMethods(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Your free trial has started!", {
        description: `No charge today. We'll remind you before your ${TRIAL_DAYS}-day trial ends.`,
      });
      const t = setTimeout(refresh, 5000);
      return () => clearTimeout(t);
    }
    if (searchParams.get("upgrade") === "required") {
      toast.info("Choose a plan to unlock the platform.");
    }
    if (searchParams.get("activated") === "manual") {
      toast.info("Card saved. Payment processing isn't enabled yet.", {
        description: "Connect a payment processor to activate plans automatically.",
      });
    }
  }, [searchParams, refresh]);

  const handleCheckout = (planId: "analyze" | "broker") => {
    router.push(`/app/billing/checkout?plan=${planId}`);
  };

  const removeMethod = async (id: string) => {
    try {
      const res = await fetch(`/api/billing/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove card");
      toast.success("Card removed");
      await loadMethods();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove card"
      );
    }
  };

  const cancelSubscription = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not cancel your subscription");
      }
      toast.success("Subscription canceled", {
        description:
          "You'll keep full access until the end of your current billing period.",
      });
      setCancelOpen(false);
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setCancelling(false);
    }
  };

  const currentPlan = account?.plan ?? null;
  const onTrial = account?.planStatus === "trialing" && !!account?.trialEndsAt;
  const trialDaysLeft = daysRemaining(account?.trialEndsAt);
  const planLabel = currentPlan
    ? PLAN_LABELS[currentPlan] ?? currentPlan
    : `Free tier · ${FREE_ANALYSIS_LIMIT} analyses/month`;
  const statusLabel = account?.planStatus
    ? account.planStatus === "active"
      ? "active"
      : account.planStatus === "trialing"
        ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in trial`
        : account.planStatus.replace("_", " ")
    : "upgrade to unlock unlimited";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Dashboard"
        title="Billing"
        description="Manage your subscription, plans and payment methods."
        actions={
          <Link
            href="/app/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.06]"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            View plans
          </Link>
        }
      />

      {/* Free trial banner */}
      {onTrial && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.1] to-transparent px-4 py-3.5">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-300">
              You&apos;re on your {TRIAL_DAYS}-day free trial
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} remaining. You
              won&apos;t be charged until{" "}
              {new Date(account!.trialEndsAt!).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              . Cancel anytime before then and you pay nothing.
            </p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <CreditCard className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="font-heading text-lg font-semibold">{planLabel}</p>
        </div>
        <span
          className={cn(
            "ml-auto hidden rounded-full border px-3 py-1 text-xs sm:block",
            currentPlan && (account?.planStatus === "active" || onTrial)
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-white/[0.1] bg-white/[0.03] text-muted-foreground"
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Subscription management */}
      {currentPlan && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              {account?.planStatus === "canceled"
                ? "Subscription canceled"
                : "Manage your subscription"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {account?.planStatus === "canceled"
                ? "You'll keep full access until the end of the period you've paid for. You can resubscribe anytime."
                : "Cancel anytime, no fees. You'll keep full access until the end of your current billing period."}
            </p>
          </div>
          {account?.planStatus === "canceled" ? (
            <Link
              href="/app/pricing"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.06]"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Resubscribe
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/[0.12]"
            >
              <XCircle className="h-4 w-4" />
              Cancel subscription
            </button>
          )}
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription>
              You&apos;ll keep full access until the end of your current billing
              period. After that your account moves to the free tier — no hidden
              fees, and you can resubscribe whenever you like.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.06]"
            >
              Keep my plan
            </button>
            <button
              type="button"
              onClick={cancelSubscription}
              disabled={cancelling}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {cancelling ? "Canceling…" : "Yes, cancel"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plans */}
      <div className="grid gap-5 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                plan.highlight
                  ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-glow-emerald"
                  : "border-white/[0.08] bg-white/[0.02]"
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-950">
                  <Star className="h-3 w-3" /> Most Popular
                </span>
              )}
              <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-bold">${plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent}
                onClick={() => handleCheckout(plan.id)}
                className={cn(
                  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  plan.highlight
                    ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                    : "border border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.06]"
                )}
              >
                {isCurrent ? "Current plan" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment methods */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Payment methods</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cards on file for your subscription.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCardDialogOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.06]"
          >
            <Plus className="h-4 w-4" />
            Add card
          </button>
          <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add a payment method</DialogTitle>
                <DialogDescription>
                  Enter your card details below.
                </DialogDescription>
              </DialogHeader>
              <PaymentMethodForm
                onDone={() => {
                  setCardDialogOpen(false);
                  void loadMethods();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loadingMethods ? (
          <div className="flex justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
        ) : methods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-10 text-center">
            <CreditCard className="mx-auto h-6 w-6 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No payment methods on file yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-muted-foreground">
                  {BRAND_LABELS[m.brand] ?? "Card"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">
                    {BRAND_LABELS[m.brand] ?? "Card"}
                    {m.cardNumber ? ` ${formatCardNumber(m.cardNumber)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {String(m.expMonth).padStart(2, "0")}/
                    {String(m.expYear).slice(-2)}
                    {m.name ? ` · ${m.name}` : ""}
                  </p>
                </div>
                {m.isDefault && (
                  <span className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                    Default
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeMethod(m.id)}
                  className={cn(
                    "rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400",
                    !m.isDefault && "ml-auto"
                  )}
                  aria-label="Remove card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, label: "Secure, encrypted checkout" },
          { icon: CalendarDays, label: `${TRIAL_DAYS}-day free trial on every plan` },
          { icon: BadgeCheck, label: `${MONEY_BACK_DAYS}-day money-back guarantee` },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 text-xs text-muted-foreground"
          >
            <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
            {label}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground/60">
        Cancel anytime from this page — your access runs to the end of the
        billing period, and you can request a full refund within{" "}
        {MONEY_BACK_DAYS} days of your first charge.
      </p>
    </div>
  );
}
