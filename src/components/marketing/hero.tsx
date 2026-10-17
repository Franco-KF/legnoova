import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS } from "@/config/billing";
import { HeroMockAnalysis } from "./hero-mock-analysis";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Radial glows */}
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl" />
        <div className="absolute right-[-200px] top-40 h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-150px] h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        {/* Announcement pill */}
        <div className="animate-fade-in-up flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm text-emerald-300/90">
              A clearer second opinion for your forex chart
            </span>
            <span className="hidden h-3.5 w-px bg-emerald-500/30 sm:block" />
            <span className="hidden text-sm font-semibold text-emerald-300 sm:block">
              {TRIAL_DAYS}-day free trial
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up animation-delay-100 mx-auto mt-7 max-w-4xl text-center font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Get a second opinion on your forex chart{" "}
          <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            before you trade.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
        >
          Upload a chart to get a structured AI analysis with a potential entry,
          stop-loss, targets and the reasoning behind them. Review the evidence,
          compare it with your own read, and make your own decision.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            render={<Link href="/register" />}
            size="lg"
            className="group h-12 w-full gap-2 rounded-xl px-8 text-base shadow-glow-emerald transition-all hover:scale-[1.02] sm:w-auto"
          >
            Analyze My Chart
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            render={<Link href="#sample-analysis" />}
            size="lg"
            variant="outline"
            className="h-12 w-full gap-2 rounded-xl px-8 text-base border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.05] sm:w-auto"
          >
            <GitCompareArrows className="h-4 w-4 text-teal-400" />
            Explore the sample
          </Button>
        </div>

        {/* Trust indicators */}
        <div
          className="animate-fade-in-up animation-delay-400 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Reasoning shown, not just a call
          </div>
          <div className="hidden h-4 w-px bg-white/[0.1] sm:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-teal-400" />
            Potential levels · Evidence · Scenarios
          </div>
          <div className="hidden h-4 w-px bg-white/[0.1] sm:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            {TRIAL_DAYS}-day trial · Payment method required
          </div>
        </div>

        {/* Mock analysis */}
        <div
          id="sample-analysis"
          className="animate-fade-in-up animation-delay-500 mt-12 scroll-mt-20"
        >
          <HeroMockAnalysis />
          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            Illustrative example only—not live market data or a trade
            recommendation. AI analysis can be wrong.
          </p>
        </div>
      </div>
    </section>
  );
}
