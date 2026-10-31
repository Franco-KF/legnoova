import { PLANS } from "@/config/plans";
import { MONEY_BACK_DAYS } from "@/config/billing";
import { PricingCard } from "./pricing-card";
import { BadgeCheck, ShieldCheck } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Pricing
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Start Reading Your Charts for $29.<br className="hidden sm:block" /> Add Simple MT5 Tools for $59.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Get clear chart reviews, signals and a trading journal for $29 a month.
            Add simple demo-first MT5 tools for $59 when you are ready. Choose your
            plan and stay in control. Trading always carries risk.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Secure monthly billing
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {MONEY_BACK_DAYS}-day money-back guarantee
            </span>
          </div>
        </div>

        <div className="mt-16 grid max-w-4xl gap-8 md:grid-cols-2 lg:gap-6 mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              popular={plan.id === "broker"}
              ctaLabel={plan.id === "broker" ? "Activate MT5 tools" : "Start chart analysis"}
              footnote={plan.note}
            />
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, label: "Secure monthly billing" },
            { icon: BadgeCheck, label: `${MONEY_BACK_DAYS}-day money-back guarantee` },
            { icon: ShieldCheck, label: "Cancel anytime, no hidden fees" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 text-xs text-muted-foreground"
            >
              <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
