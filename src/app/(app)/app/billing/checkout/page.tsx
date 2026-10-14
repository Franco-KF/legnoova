"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PLANS } from "@/config/plans";
import { PaymentMethodForm } from "@/components/billing/payment-method-form";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const plan = useMemo(
    () => PLANS.find((p) => p.id === planId) ?? null,
    [planId]
  );

  if (!plan) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="font-heading text-lg font-semibold">Plan not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a plan from the billing page to continue.
        </p>
        <Link
          href="/app/billing"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to billing
        </Link>
      </div>
    );
  }

  const tax = 0;
  const total = plan.price + tax;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/app/billing"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to billing
      </Link>

      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Lock className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Complete your purchase to activate {plan.name}.
          </p>
        </div>
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
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">${plan.price.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="font-medium">${tax.toFixed(2)}</dd>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <dt className="font-semibold">Total due today</dt>
                  <dd className="font-heading text-lg font-bold text-emerald-400">
                    ${total.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Billed monthly. Cancel anytime — no long-term contract.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Secure checkout" },
              { icon: RefreshCw, label: "Cancel anytime" },
              { icon: BadgeCheck, label: "Instant activation" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs text-muted-foreground"
              >
                <Icon className="h-4 w-4 text-emerald-400" />
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
              Enter your card to activate your subscription.
            </p>
            <PaymentMethodForm
              submitLabel={`Pay $${total.toFixed(2)}`}
              successMessage="Demo payment submitted"
              onDone={() => router.push("/app/billing?checkout=success")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
