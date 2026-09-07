import { Upload, Cpu, Lightbulb, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Chart",
    description:
      "Drag and drop a screenshot of your forex chart. We accept PNG, JPG, and WEBP files. Add the symbol and timeframe if you know them.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analyzes Market Structure",
    description:
      "Our vision AI reads your chart, extracts market structure, key levels and patterns. Seven independent strategies analyze it in parallel.",
    accent: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Get Your Trading Setup",
    description:
      "A consensus engine combines the strategies into a clear BUY, SELL or WAIT signal with entry, stop loss and take profit levels.",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            How It Works
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            From Chart to Insight in<br className="hidden sm:block" /> Three Simple
            Steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            No setup, no complex tools. Just upload, analyze, and get structured
            market insight.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.step}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <div className="absolute right-6 top-6 font-heading text-5xl font-bold text-white/[0.04] transition-colors group-hover:text-white/[0.08]">
                {step.step}
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}
              >
                <step.icon className={`h-6 w-6 ${step.accent}`} />
              </div>

              <h3 className="mt-6 font-heading text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400/80">
                <CheckCircle2 className="h-4 w-4" />
                <span>Part of the standard flow</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
