import type { Metadata } from "next";
import { PLANS } from "@/config/plans";
import { PricingCard } from "@/components/marketing/pricing-card";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { FAQ } from "@/components/marketing/faq";
import { CTASection } from "@/components/marketing/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { ShieldAlert } from "lucide-react";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Give your next trade a second opinion. Start free, upgrade when you need more AI chart analyses. Cancel anytime — no hidden fees.",
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    type: "website",
    title: "Pricing — Legnoova AI",
    description:
      "Start free, upgrade when you need more analyses. Your next trade deserves a second opinion.",
    url: `${siteUrl}/pricing`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Legnoova AI",
    description:
      "Start free, upgrade when you need more analyses. Your next trade deserves a second opinion.",
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
        title={<>Your Next Trade Deserves<br className="hidden sm:block" /> a Second Opinion</>}
        subtitle="Start free, analyze your own charts, and upgrade when you want unlimited Legnoova AI validation. Cancel anytime — no hidden fees."
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
              Legnoova AI provides market analysis for informational
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
