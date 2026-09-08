import type { Metadata } from "next";
import { Features } from "@/components/marketing/features";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { CTASection } from "@/components/marketing/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore Legnoova AI feature set: AI chart analysis, trend detection, market structure, support and resistance, entry TP & SL ideas, multi-timeframe thinking and analysis history.",
  alternates: {
    canonical: `${siteUrl}/features`,
  },
  openGraph: {
    type: "website",
    title: "Features — Legnoova AI",
    description:
      "AI chart analysis, trend detection, market structure, levels, entry TP & SL ideas, and multi-timeframe thinking.",
    url: `${siteUrl}/features`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — Legnoova AI",
    description:
      "Everything you need for smarter chart analysis. Your AI second opinion for forex.",
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Features — Legnoova AI",
  url: `${siteUrl}/features`,
  description:
    "All Legnoova AI features: chart analysis, trend detection, market structure, support & resistance, entries, take profit, stop loss, multi-timeframe thinking and history.",
};

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={webPageSchema} />
      <SubpageHero
        eyebrow="Features"
        title={<>Everything You Need to<br className="hidden sm:block" /> Validate Your Analysis</>}
        subtitle="Every feature of Legnoova is engineered to give you one thing: a clearer decision before you risk your money."
      />
      <Features />
      <CTASection />
    </>
  );
}
