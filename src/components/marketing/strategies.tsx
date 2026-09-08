import {
  Shapes,
  Layers,
  TrendingUp,
  BetweenHorizonalStart,
  Zap,
  BarChart3,
} from "lucide-react";

const strategies = [
  {
    icon: Shapes,
    name: "Price Action",
    weight: "20",
    description: "Reading candlestick patterns and raw price behavior.",
    accent: "text-emerald-400",
    bar: "bg-emerald-400",
  },
  {
    icon: Layers,
    name: "Market Structure",
    weight: "20",
    description: "Higher highs, lower lows, break of structure.",
    accent: "text-teal-400",
    bar: "bg-teal-400",
  },
  {
    icon: TrendingUp,
    name: "Trend Following",
    weight: "15",
    description: "Identifying and aligning with directional momentum.",
    accent: "text-cyan-400",
    bar: "bg-cyan-400",
  },
  {
    icon: BetweenHorizonalStart,
    name: "Support & Resistance",
    weight: "15",
    description: "Locating key price levels where reactions occur.",
    accent: "text-amber-400",
    bar: "bg-amber-400",
  },
  {
    icon: Zap,
    name: "Breakout",
    weight: "15",
    description: "Detecting consolidations and range expansions.",
    accent: "text-violet-400",
    bar: "bg-violet-400",
  },
  {
    icon: BarChart3,
    name: "Supply & Demand",
    weight: "15",
    description: "Zones where institutional order flow imbalances sit.",
    accent: "text-rose-400",
    bar: "bg-rose-400",
  },
];

export function Strategies() {
  return (
    <section id="strategies" className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: intro */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Built for Real Traders
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Built for Traders Who<br className="hidden sm:block" /> Already Know
              How to Trade
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              This isn&apos;t designed to replace your strategy. It&apos;s designed
              to make your analysis stronger. You bring the strategy — Legnoova AI
              brings another perspective — and you make the final decision.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Instead of a single opaque prompt, Legnoova runs six independent
              strategy modules. Each one analyzes your chart through a different
              framework, then a consensus engine weighs their agreement to reach
              a final signal.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              You see exactly which strategies agree, which conflict, and how
              confident the overall setup is — so you can make your own informed
              decision.
            </p>

            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Default Weights</span>
                <span>Price Action &amp; Structure lead</span>
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                {strategies.map((s) => (
                  <div
                    key={s.name}
                    className={`${s.bar} h-full`}
                    style={{ width: `${s.weight}%` }}
                    title={`${s.name}: ${s.weight}%`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: strategy cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {strategies.map((s) => (
              <div
                key={s.name}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] ${s.accent}`}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.weight}%
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-sm font-semibold">
                  {s.name}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
