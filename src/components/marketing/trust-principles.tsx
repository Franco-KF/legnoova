import { Ban, Eye, Clock3, ScanLine } from "lucide-react";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";

const principles = [
  {
    icon: Ban,
    title: "No made-up calls",
    description:
      "If the chart is hard to read, Legnoova can say WAIT instead of pushing a trade.",
    accent: "text-emerald-400",
    tint: "bg-emerald-500/10",
  },
  {
    icon: Eye,
    title: "See the why",
    description:
      "See the possible entry, stop and targets—and why they showed up in the analysis.",
    accent: "text-teal-400",
    tint: "bg-teal-500/10",
  },
  {
    icon: ScanLine,
    title: "No promises",
    description:
      "AI can make mistakes. Price levels are estimates, not a promise that a trade will work.",
    accent: "text-cyan-400",
    tint: "bg-cyan-500/10",
  },
  {
    icon: Clock3,
    title: "Easy to try",
    description: `Try it free for ${TRIAL_DAYS} days. Cancel anytime. The ${MONEY_BACK_DAYS}-day money-back guarantee also applies.`,
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
            Built on Trust
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Less Noise. More Clarity.
            <br className="hidden sm:block" />
            And No False Promises.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Trading is hard enough. We show our working, admit when the chart is
            unclear and leave the final call to you.
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
