"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PLANS } from "@/config/plans";
import { MONEY_BACK_DAYS, TRIAL_DAYS, getTrialEnd } from "@/config/billing";
import { PaymentMethodForm } from "@/components/billing/payment-method-form";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const plan = useMemo(
    () => PLANS.find((p) => p.id === planId) ?? null,
    [planId]
  );

  const trialDays = plan?.trialDays ?? TRIAL_DAYS;

  const trialEnd = useMemo(() => getTrialEnd(), []);
  const firstCharge = useMemo(() => getTrialEnd(), []);

  if (!plan) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="font-heading text-lg font-semibold">Plan not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a plan from the plans page to continue.
        </p>
        <Link
          href="/app/pricing"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>
      </div>
    );
  }

  const tax = 0;
  const totalDueToday = 0;
  const renewalTotal = plan.price + tax;

  const complete = async () => {
    try {
      const res = await fetch("/api/billing/test-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      if (res.ok) {
        router.push("/app/billing?checkout=success");
      } else {
        router.push("/app/billing?activated=manual");
      }
    } catch {
      router.push("/app/billing?activated=manual");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/app/pricing"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to plans
      </Link>

      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Lock className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Start your {trialDays}-day free trial of {plan.name}.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200/90">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          <strong className="font-semibold">You won&apos;t be charged today.</strong>{" "}
          Your free trial runs until {formatDate(trialEnd)}. We&apos;ll only
          charge ${renewalTotal.toFixed(2)} on {formatDate(firstCharge)} — and
          you can cancel anytime before then at no cost.
        </span>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-xs text-amber-300/90">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Test mode.</strong> No real charge is processed. Completing
          checkout saves the card&apos;s number, brand and expiry, and starts
          the trial for testing only.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
        {/* Order summary */}
        <div className="order-2 lg:order-1">
          <div className="glass-panel overflow-hidden">
            <div className="border-b border-white/[0.06] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {plan.highlight ? "Recommended plan" : "Selected plan"}
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-semibold">
                    Legnoova AI — {plan.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-2xl font-bold">${plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="mb-3 text-sm font-medium">What&apos;s included</p>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/[0.06] p-6">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {plan.name} ({plan.period.replace("/", "per ")})
                  </dt>
                  <dd className="font-medium">${plan.price.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{trialDays}-day free trial</dt>
                  <dd className="font-medium text-emerald-400">
                    −${plan.price.toFixed(2)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="font-medium">${tax.toFixed(2)}</dd>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <dt className="font-semibold">Due today</dt>
                  <dd className="font-heading text-lg font-bold text-emerald-400">
                    ${totalDueToday.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
                Then <strong className="text-foreground">${renewalTotal.toFixed(2)}/month</strong>{" "}
                starting {formatDate(firstCharge)}. Auto-renews monthly. Cancel
                anytime before {formatDate(trialEnd)} and you&apos;ll never be
                charged.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {[
              { icon: CalendarDays, label: `${trialDays}-day free trial` },
              { icon: RefreshCw, label: "Cancel anytime, no fees" },
              { icon: BadgeCheck, label: `${MONEY_BACK_DAYS}-day money-back guarantee` },
              { icon: ShieldCheck, label: "Secure, encrypted checkout" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs text-muted-foreground"
              >
                <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="order-1 lg:order-2">
          <div
            className={cn(
              "glass-panel overflow-hidden p-6",
              plan.highlight && "ring-1 ring-emerald-500/30"
            )}
          >
            <h2 className="font-heading text-lg font-semibold">Payment details</h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              Add a card to start your free trial. You won&apos;t be charged
              until {formatDate(firstCharge)}.
            </p>
            <PaymentMethodForm
              submitLabel={`Start free trial — $0 today`}
              successMessage="Trial started"
              onDone={complete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
