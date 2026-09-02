import { ShieldCheck, GitBranch, Eye, RefreshCcw } from "lucide-react";

const principles = [
  {
    icon: Eye,
    title: "Only Visible Information",
    description:
      "The vision analyzer extracts data strictly from what's on your chart. Nothing is invented — if price, structure or levels can't be determined, it returns unknown rather than guessing.",
  },
  {
    icon: GitBranch,
    title: "Independent Strategy Modules",
    description:
      "Six separate strategies run in parallel, each with its own logic. This makes the engine modular, auditable and easy to extend without rewriting the core.",  },
  {
    icon: ShieldCheck,
    title: "Risk-First Philosophy",
    description:
      "When evidence is insufficient or strategies conflict, we return WAIT instead of forcing a setup. No signal is ever presented as a guaranteed profit.",
  },
  {
    icon: RefreshCcw,
    title: "Transparent and Configurable",
    description:
      "Consensus weights and thresholds are plain configuration — easy to tune. You always see agreement levels and per-strategy breakdowns.",
  },
];

export function ProductExplanation() {
  return (
    <section className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            The Product
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            AI That Reads Charts<br className="hidden sm:block" /> Honestly
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most AI tools hallucinate when they don&apos;t know the answer. Legnoova
            is architected differently — grounded in what&apos;s actually visible on
            your chart.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {principles.map((p) => (
            <div
              key={p.title}
              className="group flex gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <p.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
