"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, Check, ShieldCheck } from "lucide-react";
import { PLANS } from "@/config/plans";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";
import { PaddleInlineCheckout } from "@/components/billing/paddle-inline-checkout";

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const plan = useMemo(() => PLANS.find((item) => item.id === planId) ?? null, [planId]);

  if (!plan) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <h1 className="font-heading text-xl font-semibold">Choose a plan first</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick the plan you want, then come back to secure checkout.</p>
        <Link href="/app/pricing" className="mt-6 inline-flex rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">View plans</Link>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <Link href="/app/pricing" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4"/> Back to plans
      </Link>

      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Secure checkout</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Start your {TRIAL_DAYS}-day free trial</h1>
        <p className="mt-3 text-muted-foreground">Complete your subscription securely through Paddle. Legnoova does not collect or store your payment card details.</p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
        <section className="glass-panel overflow-hidden rounded-2xl border border-emerald-500/20">
          <div className="border-b border-white/[0.08] bg-gradient-to-r from-emerald-500/[0.10] to-transparent p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Your plan</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-bold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              </div>
              <p className="font-heading text-3xl font-bold">${plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">/ month</span></p>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><CalendarDays className="h-4 w-4"/>{TRIAL_DAYS} days free</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">$0 during the trial. Paddle shows the first charge date before you confirm.</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-400"/>You stay in control</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Cancel before the trial ends to avoid the first charge. Your plan renews monthly if you keep it.</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Included in this plan</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300"><Check className="h-3 w-3"/></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-emerald-400"/>{MONEY_BACK_DAYS}-day money-back guarantee</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400"/>Secure payment by Paddle</span>
            </div>
          </div>
        </section>

        <section className="glass-panel min-w-0 rounded-2xl border border-white/[0.08] p-4 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300"><ShieldCheck className="h-5 w-5"/></span>
            <div><h2 className="font-heading text-lg font-semibold">Checkout with Paddle</h2><p className="mt-1 text-sm text-muted-foreground">Enter your payment method in Paddle&apos;s secure checkout to start your plan.</p></div>
          </div>
          <PaddleInlineCheckout planId={plan.id} planName={plan.name}/>
        </section>
      </div>
      <p className="mx-auto max-w-3xl pb-6 text-center text-xs leading-5 text-muted-foreground">Paddle handles payment details and authorization. Legnoova grants plan access only after Paddle confirms the subscription. Applicable taxes and the first payment date are shown by Paddle.</p>
    </main>
  );
}
