"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { PLANS } from "@/config/plans";
import { TRIAL_DAYS } from "@/config/billing";
import { PaddleInlineCheckout } from "@/components/billing/paddle-inline-checkout";

export default function CheckoutPage() {
  return <Suspense fallback={<CheckoutLoading />}><CheckoutContent /></Suspense>;
}

function CheckoutLoading() {
  return <main className="mx-auto max-w-3xl px-4 py-8"><div className="glass-panel h-96 animate-pulse" /></main>;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const plan = useMemo(() => PLANS.find((item) => item.id === planId) ?? null, [planId]);

  if (!plan) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">Choose a plan first</h1>
        <p className="mt-2 text-sm text-muted-foreground">Select a plan to continue to secure checkout.</p>
        <Link href="/app/pricing" className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">View plans</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-1 pb-8 sm:px-0">
      <Link href="/app/pricing" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to plans</Link>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Secure checkout</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Start your {TRIAL_DAYS}-day free trial</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pay securely through Paddle. Your card details never pass through or get stored by Legnoova.</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]">
        {/* Checkout is first and remains at the top on phones. */}
        <section className="glass-panel order-first min-w-0 overflow-hidden border-emerald-500/25 p-3 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /><div><h2 className="font-heading font-semibold">Payment details</h2><p className="text-xs text-muted-foreground">Secure checkout by Paddle</p></div></div>
          <PaddleInlineCheckout planId={plan.id} planName={plan.name} />
        </section>

        <aside className="glass-panel p-5 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Your plan</p>
          <div className="mt-2 flex items-end justify-between gap-3"><h2 className="font-heading text-xl font-bold">{plan.name}</h2><p className="shrink-0 font-heading text-2xl font-bold">${plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p></div>
          <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
          <div className="my-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-sm"><strong className="text-emerald-200">{TRIAL_DAYS} days free</strong><p className="mt-1 text-xs text-muted-foreground">Paddle shows the first charge date before you confirm.</p></div>
          <ul className="space-y-2 text-sm text-foreground/80">{plan.features.slice(0, 5).map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{feature}</li>)}</ul>
          <p className="mt-5 border-t border-white/[0.08] pt-4 text-xs leading-5 text-muted-foreground">Cancel anytime. Paddle handles payment and taxes. Access starts after Paddle confirms your subscription.</p>
        </aside>
      </div>
    </main>
  );
}
