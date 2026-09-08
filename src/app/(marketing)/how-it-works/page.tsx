import type { Metadata } from "next";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CTASection } from "@/components/marketing/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/config/site";
import {
  ScanSearch,
  Boxes,
  Scale,
  GitMerge,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From screenshot to second opinion — how the Legnoova AI pipeline analyzes your forex chart across six transparent stages and explains its reasoning.",
  alternates: {
    canonical: `${siteUrl}/how-it-works`,
  },
  openGraph: {
    type: "website",
    title: "How It Works — Legnoova AI",
    description:
      "Upload your chart and get a second opinion you can verify — six clear stages, no black boxes, no invented numbers.",
    url: `${siteUrl}/how-it-works`,
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works — Legnoova AI",
    description:
      "An honest, transparent AI pipeline — from chart screenshot to structured forex insight.",
  },
};

const pipeline = [
  {
    icon: ScanSearch,
    step: "1",
    title: "Vision Analyzer",
    description:
      "Legnoova AI's vision engine reads your uploaded chart and extracts only what's visible: market structure, candlesticks, key levels and any present indicators. Nothing is invented.",
  },
  {
    icon: Boxes,
    step: "2",
    title: "Structured Chart Data",
    description:
      "The vision output is normalized into a structured, typed representation that the strategy modules can reliably consume.",
  },
  {
    icon: GitMerge,
    step: "3",
    title: "Independent Strategy Modules",
    description:
      "Six strategy modules run in parallel — Price Action, Market Structure, Trend, Support & Resistance, Breakout, Supply & Demand. Each returns its own signal, confidence and reasoning.",
  },
  {
    icon: Scale,
    step: "4",
    title: "Consensus Engine",
    description:
      "A configurable weighting system measures agreement across strategies. If they strongly converge, a signal forms; if they conflict, Legnoova returns WAIT.",
  },
  {
    icon: ShieldCheck,
    step: "5",
    title: "Risk Validator",
    description:
      "The risk validator checks that any proposed entry, stop loss and take profit are internally consistent and justified — never fabricated from missing data.",
  },
  {
    icon: FileCheck2,
    step: "6",
    title: "Final Structured Result",
    description:
      "The pipeline produces a clean, validated output: bias, signal, confidence, trading setup with entry / SL / TP, and a per-strategy breakdown you can review.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "How It Works — Legnoova AI",
          url: `${siteUrl}/how-it-works`,
          description:
            "From chart screenshot to structured insight: vision extraction, structured data, six independent strategy modules, consensus engine, risk validator and a final validated result.",
        }}
      />
      <SubpageHero
        eyebrow="How It Works"
        title={<>An Honest, Transparent Legnoova AI Pipeline</>}
        subtitle="Upload your chart and get a second opinion you can verify — six clear stages, no black boxes, no invented numbers."
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {pipeline.map((step) => (
              <div
                key={step.step}
                className="flex gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-colors hover:border-white/[0.14]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <step.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="mt-1 font-heading text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <HowItWorks />
          </div>
        </div>
      </section>
      <CTASection />
    </>
  );
}
