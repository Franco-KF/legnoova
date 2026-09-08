import { PLANS } from "@/config/plans";
import { PricingCard } from "./pricing-card";
import { ShieldAlert } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Pricing
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Your Next Trade Deserves<br className="hidden sm:block" /> a Second
            Opinion
          </h2>
          <p className="mt-4 text-muted-foreground">
            Don&apos;t enter blindly. Analyze your chart, challenge your setup, and
            trade with more clarity.
          </p>
        </div>

        <div className="mt-16 grid max-w-4xl gap-8 md:grid-cols-2 lg:gap-6 mx-auto">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm leading-6 text-muted-foreground">
            Legnoova AI provides market analysis for informational
            purposes and does not guarantee trading results. Always verify the
            setup before placing a trade.
          </p>
        </div>
      </div>
    </section>
  );
}
