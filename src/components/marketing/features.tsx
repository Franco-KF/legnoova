import {
  BrainCircuit,
  Network,
  Scale,
  Gauge,
  LayoutDashboard,
  Eye,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Multi-Strategy AI Engine",
    description:
      "Six independent strategy modules analyze your chart simultaneously. Each brings a different lens to market structure, price action and momentum.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    tint: "bg-emerald-500/10",
  },
  {
    icon: Network,
    title: "Consensus Engine",
    description:
      "Configurable strategy weights and agreement thresholds combine module results into a single, transparent verdict. No black-box answers.",
    accent: "text-teal-400",
    border: "hover:border-teal-500/30",
    tint: "bg-teal-500/10",
  },
  {
    icon: Scale,
    title: "Risk-First Validation",
    description:
      "Every setup goes through a risk validator that checks entries, stop losses and take profits — and falls back to WAIT when evidence is insufficient.",
    accent: "text-amber-400",
    border: "hover:border-amber-500/30",
    tint: "bg-amber-500/10",
  },
  {
    icon: Eye,
    title: "Vision-Based Analysis",
    description:
      "Powered by Gemini vision AI, Legnoova reads what's actually on your chart — extracting only information that's visible or reliably inferable.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-500/30",
    tint: "bg-cyan-500/10",
  },
  {
    icon: LayoutDashboard,
    title: "Professional Dashboard",
    description:
      "Track your analysis history, saved setups and subscription usage in a clean, trading-terminal interface built for focus.",
    accent: "text-violet-400",
    border: "hover:border-violet-500/30",
    tint: "bg-violet-500/10",
  },
  {
    icon: Gauge,
    title: "Transparent Confidence",
    description:
      "Every signal is accompanied by a confidence score and per-strategy breakdown, so you always know how much agreement backs a setup.",
    accent: "text-rose-400",
    border: "hover:border-rose-500/30",
    tint: "bg-rose-500/10",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Features
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Built Like a Professional<br className="hidden sm:block" /> Trading
            Terminal
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every feature is designed to give you clear, structured insight —
            not noise.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] ${feature.border}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.tint}`}
              >
                <feature.icon className={`h-6 w-6 ${feature.accent}`} />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
