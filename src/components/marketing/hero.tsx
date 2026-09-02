import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroMockAnalysis } from "./hero-mock-analysis";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-bg-pattern mask-fade-bottom absolute inset-0 opacity-40" />

        {/* Radial glows */}
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl" />
        <div className="absolute right-[-200px] top-40 h-[400px] w-[400px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-150px] h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        {/* Announcement pill */}
        <div className="animate-fade-in-up flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-sm text-emerald-300/90">
              Powered by advanced AI vision analysis
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up animation-delay-100 mx-auto mt-8 max-w-4xl text-center font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Turn Your Forex Charts Into{" "}
          <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            AI-Powered
          </span>{" "}
          Trading Insights
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
        >
          Upload a forex chart and let Legnoova analyze market structure, price
          action and multiple trading strategies to help you identify potential
          setups.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            render={<Link href="/register" />}
            size="lg"
            className="group h-12 w-full gap-2 rounded-xl px-8 text-base shadow-glow-emerald transition-all hover:scale-[1.02] sm:w-auto"
          >
            Analyze Your First Chart
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            render={<Link href="/how-it-works" />}
            size="lg"
            variant="outline"
            className="h-12 w-full gap-2 rounded-xl px-8 text-base border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.05] sm:w-auto"
          >
            <Bot className="h-4 w-4 text-teal-400" />
            See How It Works
          </Button>
        </div>

        {/* Trust indicators */}
        <div
          className="animate-fade-in-up animation-delay-400 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Informational analysis only
          </div>
          <div className="hidden h-4 w-px bg-white/[0.1] sm:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-teal-400" />
            6 independent trading strategies
          </div>
          <div className="hidden h-4 w-px bg-white/[0.1] sm:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4 text-cyan-400" />
            Clear BUY / SELL / WAIT states
          </div>
        </div>

        {/* Mock analysis */}
        <div className="animate-fade-in-up animation-delay-500 mt-16">
          <HeroMockAnalysis />
        </div>
      </div>
    </section>
  );
}
