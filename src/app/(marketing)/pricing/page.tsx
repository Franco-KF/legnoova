import type { Metadata } from "next";
import { PLANS } from "@/config/plans";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";
import { PricingCard } from "@/components/marketing/pricing-card";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { FAQ } from "@/components/marketing/faq";
import { CTASection } from "@/components/marketing/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { BadgeCheck, CalendarDays, ShieldCheck } from "lucide-react";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Give your next trade a second opinion. Start with a ${TRIAL_DAYS}-day free trial, upgrade when you need more AI chart analyses, and enjoy a ${MONEY_BACK_DAYS}-day money-back guarantee. Cancel anytime — no hidden fees.`,
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    type: "website",
    title: "Pricing — Legnoova AI",
    description: `Start with a ${TRIAL_DAYS}-day free trial. Your next trade deserves a second opinion.`,
    url: `${siteUrl}/pricing`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Legnoova AI",
    description: `Start with a ${TRIAL_DAYS}-day free trial. Your next trade deserves a second opinion.`,
  },
};

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Legnoova AI",
  description:
    "AI-powered forex chart analysis. An independent second opinion that validates your setups before you trade.",
  url: `${siteUrl}/pricing`,
  brand: {
    "@type": "Brand",
    name: "Legnoova AI",
  },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: String(Math.min(...PLANS.map((p) => p.price))),
    highPrice: String(Math.max(...PLANS.map((p) => p.price))),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.price),
      priceCurrency: "USD",
      description: plan.tagline,
    })),
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={pricingSchema} />
      <SubpageHero
        eyebrow="Pricing"
        title={<>Forex Tools for $29.<br className="hidden sm:block" /> Broker Automation for $59.</>}
        subtitle={`Try any plan free for ${TRIAL_DAYS} days — no charge until the trial ends. Then it's simple monthly billing, a ${MONEY_BACK_DAYS}-day money-back guarantee, and you can cancel anytime.`}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2 lg:gap-6">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                popular={plan.id === "analyze"}
                disabled={plan.id === "broker"}
                ctaLabel={plan.id === "broker" ? "Broker plan in development" : undefined}
                footnote={plan.note}
              />
            ))}
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { icon: CalendarDays, label: `Free for ${TRIAL_DAYS} days, cancel before it ends` },
              { icon: BadgeCheck, label: `${MONEY_BACK_DAYS}-day money-back guarantee` },
              { icon: ShieldCheck, label: "Auto-renews monthly · cancel anytime" },
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
      <FAQ />
      <CTASection />
    </>
  );
}
