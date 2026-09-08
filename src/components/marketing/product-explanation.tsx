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
    title: "Get an independent Legnoova AI analysis",
    description:
      "Legnoova AI reads the same chart you're looking at — and returns its own honest read of it.",
  },
  {
    icon: GitCompareArrows,
    step: "03",
    title: "Compare it with your own strategy",
    description:
      "Lay Legnoova AI's view next to yours. Agreement is confirmation; disagreement is a reason to dig deeper.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Trade with more clarity",
    description:
      "Walk into the trade with a pressure-tested setup — not an impulse.",
  },
];

export function ProductExplanation() {
  return (
    <section className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            The Second Opinion
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            You Don&apos;t Need Another Signal Group.
            <br className="hidden sm:block" />
            <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              You Need a Second Opinion.
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            You already spend time reading charts, spotting trends, drawing
            support and resistance, and planning entries. Legnoova helps you
            pressure-test that analysis before putting your money at risk.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-4">
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