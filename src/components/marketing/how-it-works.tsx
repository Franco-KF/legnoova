import { Upload, Cpu, Target, ClipboardList } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Chart",
    description:
      "Take a screenshot of your trading chart and upload it. PNG, JPG or WEBP — done in seconds.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Legnoova AI Scans It",
    description:
      "Legnoova AI reads market structure, trend, support/resistance, order flow and prices visible on the chart, then checks the setup against every strategy.",
    accent: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: Target,
    step: "03",
    title: "Get a Structured Signal",
    description:
      "Receive a tradable signal: direction with confidence, entry, stop-loss, dynamic take-profit targets (TP1–TP3) and the risk:reward — plus the evidence behind every level.",
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: ClipboardList,
    step: "04",
    title: "Trade, Then Log the Outcome",
    description:
      "Take the trade or sit it out. Mark what happened — TP hit or stopped — and your hit rate vs Legnoova AI builds in your dashboard.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            How It Works
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            From Chart to Signal<br className="hidden sm:block" /> in Seconds
          </h2>
          <p className="mt-4 text-muted-foreground">
            No complex setup, no signals you can&apos;t verify. Upload, scan,
            and get a signal with the full reasoning behind it.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
