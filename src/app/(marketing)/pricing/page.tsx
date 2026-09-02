import { PLANS } from "@/config/plans";
import { PricingCard } from "@/components/marketing/pricing-card";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { FAQ } from "@/components/marketing/faq";
import { CTASection } from "@/components/marketing/cta-section";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Pricing",
  description:
    "Choose the right Legnoova plan. Start free, upgrade to Pro or Elite when you need more analyses.",
};

export default function PricingPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Pricing"
        title={<>Simple, Transparent Plans</>}
        subtitle="Start free and upgrade when you need more analyses. Cancel anytime — no hidden fees."
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 lg:gap-6">
            {PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
          <div className="mx-auto mt-12 flex max-w-3xl items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-left">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm leading-6 text-muted-foreground">
              Legnoova provides AI-generated market analysis for informational
              purposes and does not guarantee trading results. Always verify the
              setup before placing a trade.
            </p>
          </div>
        </div>
      </section>
      <FAQ />
      <CTASection />
    </>
  );
}
