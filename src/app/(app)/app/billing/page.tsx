"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, FREE_ANALYSIS_LIMIT } from "@/config/plans";
import { startCheckout } from "@/lib/paddle-client";
import { Check, CreditCard, Loader2, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AccountData {
  plan: string | null;
  planStatus: string | null;
  planCurrentPeriodEnd: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  analyze: "Everything · $29/mo",
  broker: "Everything + Broker · $59/mo",
};

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
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetchAccount().then((user) => {
      if (user) setAccount(user);
    });
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
    if (searchParams.get("checkout") === "success") {
      toast.success("Payment received! Your plan will activate momentarily.");
      // Webhook usually lands within seconds; poll once shortly after.
      const t = setTimeout(refresh, 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, refresh]);

  const handleCheckout = async (planId: "analyze" | "broker") => {
    setLoadingPlan(planId);
    try {
      await startCheckout(planId);
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Checkout failed. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentPlan = account?.plan ?? null;
  const planLabel = currentPlan
    ? PLAN_LABELS[currentPlan] ?? currentPlan
    : `Free tier · ${FREE_ANALYSIS_LIMIT} analyses/month`;
  const statusLabel = account?.planStatus
    ? account.planStatus === "active"
      ? "active"
      : account.planStatus.replace("_", " ")
    : "upgrade to unlock unlimited";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your subscription and usage plan.
        </p>
      </div>

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
            currentPlan && account?.planStatus === "active"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-white/[0.1] bg-white/[0.03] text-muted-foreground"
          )}
        >
          {statusLabel}
        </span>
      </div>

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
                disabled={isCurrent || loadingPlan === plan.id}
                onClick={() => handleCheckout(plan.id)}
                className={cn(
                  "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  plan.highlight
                    ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                    : "border border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.06]"
                )}
              >
                {loadingPlan === plan.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isCurrent ? "Current plan" : loadingPlan === plan.id ? "Opening checkout…" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground/60">
        <ShieldCheck className="h-3.5 w-3.5" />
        Payments are processed securely by Paddle. Cancel anytime.
      </p>
    </div>
  );
}
