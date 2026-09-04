"use client";

import { PLANS } from "@/config/plans";
import { Check, CreditCard, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillingPage() {
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
          <p className="font-heading text-lg font-semibold">Analyse · Free trial</p>
        </div>
        <span className="ml-auto hidden rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground sm:block">
          auto-renews unavailable
        </span>
      </div>

      {/* Plans */}
      <div className="grid gap-5 sm:grid-cols-2">
        {PLANS.map((plan) => (
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
              className={cn(
                "mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                plan.highlight
                  ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  : "border border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.06]"
              )}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground/60">
        Payments are processed securely. Kubernetes Paddle checkout integration
        is coming soon.
      </p>
    </div>
  );
}
