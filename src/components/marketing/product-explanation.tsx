import { Upload, Eye, GitCompareArrows, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your chart",
    description:
      "Take a screenshot of your TradingView or trading platform chart and upload it.",
  },
  {
    icon: Eye,
    step: "02",
    title: "See the key levels",
    description:
      "See the possible trend, entry, stop and targets—with a plain-language reason for each.",
  },
  {
    icon: GitCompareArrows,
    step: "03",
    title: "Decide for yourself",
    description:
      "See where the analysis matches your plan—and where it does not. The choice is always yours.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Choose your next step",
    description:
      "Use it as a guide, or wait if the chart is unclear. No pressure to take a trade.",
  },
];

export function ProductExplanation() {
  return (
    <section className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            A Better Way to Check Your Chart
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Stop Chasing Calls Across Groups.
            <br className="hidden sm:block" />
            <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Get the full picture in one place.
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Upload a chart screenshot. Get a clear second look, with possible
            trade levels and the reasons behind them. No more piecing together
            chat messages. You stay in control—no tool can promise a win.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <div className="absolute right-6 top-6 font-heading text-5xl font-bold text-white/[0.04]">
                {s.step}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <s.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mt-5 font-heading text-base font-semibold">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {s.description}
              </p>
              {i < steps.length - 1 && (
                <div className="mt-6 hidden items-center gap-2 text-xs text-emerald-400/60 md:flex">
                  <span className="font-mono">{s.step} → {steps[i + 1].step}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
