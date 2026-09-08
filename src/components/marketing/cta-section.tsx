import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-transparent p-12 text-center sm:p-16">
        {/* Decorative */}
        <div className="pointer-events-none absolute inset-0">
          <div className="grid-bg-pattern absolute inset-0 opacity-30" />
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>

        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
          </div>

          <h2 className="mx-auto mt-6 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Before Your Next Trade...
            <br className="hidden sm:block" />
            Upload the Chart.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Let Legnoova AI challenge your analysis before you execute. One upload. One
            clear, independent read. Then make your decision.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              render={<Link href="/register" />}
              size="lg"
              className="group h-12 w-full gap-2 rounded-xl px-8 text-base shadow-glow-emerald transition-all hover:scale-[1.02] sm:w-auto"
            >
              Analyze My Chart
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              render={<Link href="/pricing" />}
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl border-white/[0.12] bg-white/[0.02] px-8 text-base hover:bg-white/[0.05] sm:w-auto"
            >
              View Pricing
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/70">
            Legnoova AI analysis is for informational and educational purposes only. It
            does not guarantee profitable trades or eliminate market risk.
          </p>
        </div>
      </div>
    </section>
  );
}
