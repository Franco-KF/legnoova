import {
  Shapes,
  Layers,
  TrendingUp,
  BetweenHorizonalStart,
  Zap,
  BarChart3,
  Landmark,
} from "lucide-react";

const strategies = [
  {
    icon: Shapes,
    name: "Price Action",
    weight: "20",
    description: "What the candles and price moves may be telling you.",
    accent: "text-emerald-400",
    bar: "bg-emerald-400",
  },
  {
    icon: Layers,
    name: "Market Structure",
    weight: "20",
    description: "How price highs and lows are forming over time.",
    accent: "text-teal-400",
    bar: "bg-teal-400",
  },
  {
    icon: TrendingUp,
    name: "Trend Following",
    weight: "15",
    description: "Whether price seems to have a clear direction.",
    accent: "text-cyan-400",
    bar: "bg-cyan-400",
  },
  {
    icon: BetweenHorizonalStart,
    name: "Support & Resistance",
    weight: "15",
    description: "Price areas where the market has turned before.",
    accent: "text-amber-400",
    bar: "bg-amber-400",
  },
  {
    icon: Zap,
    name: "Breakout",
    weight: "10",
    description: "When price may be leaving a quiet range.",
    accent: "text-violet-400",
    bar: "bg-violet-400",
  },
  {
    icon: BarChart3,
    name: "Supply & Demand",
    weight: "10",
    description: "Areas where buying or selling pressure may be strong.",
    accent: "text-rose-400",
    bar: "bg-rose-400",
  },
  {
    icon: Landmark,
    name: "Smart Money Concepts",
    weight: "10",
    description: "Popular ways traders look for key areas and price moves.",
    accent: "text-lime-400",
    bar: "bg-lime-400",
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
              Made for Every Trader
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              New to Trading? Or Already Have a Plan?
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Start with the basics or check a setup you already believe in.
              Legnoova gives you another view. You stay in charge.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Legnoova looks at your chart in several ways, such as price moves,
              trends and key levels. These views can help you ask better
              questions—but they cannot predict a winning trade.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              See where the views agree or differ, then decide what fits your plan.
            </p>

            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>What Legnoova looks at</span>
                <span>Price moves and key levels</span>
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
