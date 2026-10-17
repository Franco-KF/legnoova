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
  Zap,
} from "lucide-react";

const features = [
  {
    icon: FileImage,
    title: "A Second Look at Your Chart",
    description:
      "Upload a chart screenshot. See the possible direction, entry, stop and targets in one clear review.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    tint: "bg-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "Spot the Trend",
    description:
      "See if the chart looks to be moving up, moving down, or going sideways.",
    accent: "text-teal-400",
    border: "hover:border-teal-500/30",
    tint: "bg-teal-500/10",
  },
  {
    icon: Layers,
    title: "Read Price Swings",
    description:
      "See the highs and lows that may matter—and when the pattern could be changing.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-500/30",
    tint: "bg-cyan-500/10",
  },
  {
    icon: Grip,
    title: "Find Key Price Areas",
    description:
      "See places where price may slow down or turn. Check these areas against your own chart.",
    accent: "text-amber-400",
    border: "hover:border-amber-500/30",
    tint: "bg-amber-500/10",
  },
  {
    icon: Target,
    title: "Possible Entry, Stop & Targets",
    description:
      "Get possible levels to consider. They are estimates—not promises or exact prices.",
    accent: "text-violet-400",
    border: "hover:border-violet-500/30",
    tint: "bg-violet-500/10",
  },
  {
    icon: Clock3,
    title: "See the Bigger Picture",
    description:
      "Look at the wider trend as well as the detail in your chart.",
    accent: "text-rose-400",
    border: "hover:border-rose-500/30",
    tint: "bg-rose-500/10",
  },
  {
    icon: BellRing,
    title: "Signals & Email Alerts",
    description:
      "Keep up with new signals in your feed, or get an email about the pairs you follow.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-500/30",
    tint: "bg-cyan-500/10",
  },
  {
    icon: ClipboardList,
    title: "A Journal of Your Trades",
    description:
      "Save your choices and results. Look back to see what is working for you—and what is not.",
    accent: "text-teal-400",
    border: "hover:border-teal-500/30",
    tint: "bg-teal-500/10",
  },
  {
    icon: History,
    title: "Your Past Signals",
    description:
      "Find old signals, spot patterns and learn from the choices you have made.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    tint: "bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Automate Your Broker · $59 Plan",
    description:
      "Ready to cut out manual steps? The $59 plan is for broker links and automated trade execution. Broker trading is not active yet.",
    accent: "text-amber-400",
    border: "hover:border-amber-500/30",
    tint: "bg-amber-500/10",
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
            Everything You Need to Read a Chart
          </h2>
          <p className="mt-4 text-muted-foreground">
            Spend less time searching chats. Check your chart, follow signals
            and track your plan. Choose the $59 broker automation plan for the next step toward hands-free trading.
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
