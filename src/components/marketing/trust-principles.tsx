import { Ban, Eye, Clock3, ScanLine } from "lucide-react";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";

const principles = [
  {
    icon: Ban,
    title: "No forced signals",
    description:
      "If the chart isn't clear, you get an honest WAIT — never an invented setup just to keep you engaged.",
    accent: "text-emerald-400",
    tint: "bg-emerald-500/10",
  },
  {
    icon: Eye,
    title: "No black boxes",
    description:
      "Every signal shows its entry, stop-loss, targets and the reasoning behind each level, so you can see exactly how it was reached.",
    accent: "text-teal-400",
    tint: "bg-teal-500/10",
  },
  {
    icon: ScanLine,
    title: "No hidden numbers",
    description:
      "The analysis makes its stated levels and rationale visible. Treat estimates as uncertain, not as promises of an outcome.",
    accent: "text-cyan-400",
    tint: "bg-cyan-500/10",
  },
  {
    icon: Clock3,
    title: "No lock-in",
    description: `A ${TRIAL_DAYS}-day free trial, a ${MONEY_BACK_DAYS}-day money-back guarantee and cancel anytime — no hidden fees.`,
    accent: "text-amber-400",
    tint: "bg-amber-500/10",
  },
];

export function TrustPrinciples() {
  return (
    <section id="principles" className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Our Standard
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Traders Don&apos;t Need More Noise.
            <br className="hidden sm:block" />
            They Need More Honesty.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Transparent reasoning matters—but AI can misread a chart. Legnoova is an
            informational second opinion, and the final decision remains yours.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2">
          {principles.map((p) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${p.tint}`}
              >
                <p.icon className={`h-6 w-6 ${p.accent}`} />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold">
                {p.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
