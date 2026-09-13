import {
  FileImage,
  TrendingUp,
  Layers,
  Grip,
  Target,
  Clock3,
  History,
  BellRing,
  ClipboardList,
} from "lucide-react";

const features = [
  {
    icon: FileImage,
    title: "Legnoova AI Signal Analysis",
    description:
      "Upload a chart and get a structured signal — direction with confidence, entry, stop-loss and dynamic targets — grounded in what's actually visible on it.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    tint: "bg-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "Trend Detection",
    description:
      "Know whether the market is bullish, bearish, or ranging before you lean on a direction — every signal states the bias up front.",
    accent: "text-teal-400",
    border: "hover:border-teal-500/30",
    tint: "bg-teal-500/10",
  },
  {
    icon: Layers,
    title: "Market Structure",
    description:
      "Important highs, lows, breaks and potential changes in market structure — read institutionally, like a pro trader.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-500/30",
    tint: "bg-cyan-500/10",
  },
  {
    icon: Grip,
    title: "Support & Resistance",
    description:
      "The key price levels where the market is most likely to react — so your entries sit at the right place, not mid-range.",
    accent: "text-amber-400",
    border: "hover:border-amber-500/30",
    tint: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Entry, TP & SL in Every Signal",
    description:
      "Each signal ships with a precise entry, stop-loss, take-profit targets (TP1–TP3) and risk:reward — not vague guesses.",
    accent: "text-violet-400",
    border: "hover:border-violet-500/30",
    tint: "bg-violet-500/10",
  },
  {
    icon: Clock3,
    title: "Multi-Timeframe Thinking",
    description:
      "Analyze higher and lower timeframes to read the bigger picture before zooming into an entry.",
    accent: "text-rose-400",
    border: "hover:border-rose-500/30",
    tint: "bg-rose-500/10",
  },
  {
    icon: BellRing,
    title: "Signal Feed & Email Alerts",
    description:
      "Every signal lands in your feed, and you can get an email the moment Legnoova AI publishes a call on a pair you watch.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-500/30",
    tint: "bg-cyan-500/10",
  },
  {
    icon: ClipboardList,
    title: "Journal & Hit-Rate Tracking",
    description:
      "Log whether you took each signal and what happened — TP hit or stopped — and watch your hit rate vs Legnoova AI build up.",
    accent: "text-teal-400",
    border: "hover:border-teal-500/30",
    tint: "bg-teal-500/10",
  },
  {
    icon: History,
    title: "Full Signal History",
    description:
      "Keep every signal organized so you can review past calls, spot patterns and learn from each decision.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    tint: "bg-emerald-500/10",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Features
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for<br className="hidden sm:block" /> Smarter Chart
            Analysis
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every feature exists for one reason: to help you validate your idea
            before you risk your money.
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