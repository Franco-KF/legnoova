import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { ProductExplanation } from "@/components/marketing/product-explanation";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CoreValue } from "@/components/marketing/core-value";
import { Features } from "@/components/marketing/features";
import { Strategies } from "@/components/marketing/strategies";
import { UseCase } from "@/components/marketing/use-case";
import { Testimonials } from "@/components/marketing/testimonials";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTASection } from "@/components/marketing/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig, siteUrl } from "@/config/site";
import { faqs } from "@/config/faqs";
import { PLANS, CONSENSUS_THRESHOLDS } from "@/config/plans";

export const metadata: Metadata = {
  title: `${siteConfig.name} — AI Forex Chart Analysis`,
  description: siteConfig.description,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    title: `${siteConfig.name} — AI Forex Chart Analysis`,
    description: siteConfig.description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — AI Forex Chart Analysis`,
    description: siteConfig.description,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description: siteConfig.description,
  email: siteConfig.contactEmail,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteUrl,
  description: siteConfig.description,
  inLanguage: siteConfig.inLanguage,
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    logo: `${siteUrl}/icon.svg`,
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: siteUrl,
  offers: {
    "@type": "Offer",
    price: String(PLANS[0]?.price ?? "29"),
    priceCurrency: "USD",
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.price),
      priceCurrency: "USD",
      description: plan.tagline,
    })),
  },
  featureList: [
    "AI chart analysis",
    "Trend detection",
    "Market structure",
    "Support and resistance",
    "Entry, take profit and stop loss ideas",
    `Confidence threshold: ${CONSENSUS_THRESHOLDS.buy}% agreement to form a signal`,
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={orgSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={softwareSchema} />
      <Hero />
      <ProductExplanation />
      <HowItWorks />
      <CoreValue />
      <Features />
      <Strategies />
      <UseCase />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTASection />
    </>
  );
}