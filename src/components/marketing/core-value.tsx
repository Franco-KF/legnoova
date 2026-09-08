import { X, Check, MessageSquareText } from "lucide-react";

const legnoovaBreakdown = [
  { label: "Trend", value: "Bullish (aligned with higher timeframes)" },
  { label: "Market Structure", value: "Higher highs + higher lows" },
  { label: "Key Level", value: "1.0810 – 1.0825" },
  { label: "Potential Entry", value: "1.0815 – 1.0830" },
  { label: "Stop Loss", value: "1.0790" },
  { label: "Take Profit", value: "1.0850 / 1.0890" },
  { label: "Confidence", value: "Based on multiple technical factors" },
];

export function CoreValue() {
  return (
    <section id="why" className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Why Legnoova
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Don&apos;t Just Follow Signals.
            <br className="hidden sm:block" />
            Understand Why.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most signal platforms tell you what to do. Legnoova shows you the
            reasoning — so you can trust it, question it, and learn from it.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[1fr_auto_1.4fr]">
          {/* Typical signal platform */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-8">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                <X className="h-4 w-4 text-red-400" />
              </span>
              <h3 className="font-heading text-lg font-semibold">
                Typical Signal Services
              </h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A message pops up in your group. No context, no reasoning, no way
              to verify it.
            </p>
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 p-5">
              <p className="text-[10px] uppercase tracking-wider text-red-400/60">
                You receive
              </p>
              <p className="mt-3 font-mono text-2xl font-bold tracking-wide text-red-300">
                BUY EUR/USD
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                ...and that&apos;s it. Follow blindly or skip it — there&apos;s no way
                to know why.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden items-center lg:flex">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <MessageSquareText className="h-5 w-5 text-emerald-400" />
            </span>
          </div>

          {/* Legnoova */}
          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.06] to-transparent p-8 shadow-glow-emerald">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <Check className="h-4 w-4 text-emerald-400" />
              </span>
              <h3 className="font-heading text-lg font-semibold">
                Legnoova Analysis
              </h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A full breakdown with entries, exits, and the reasoning behind
              every number.
            </p>
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 p-5">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/60">
                You receive
              </p>
              <div className="mt-3 space-y-2.5">
                {legnoovaBreakdown.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="text-right font-mono text-sm text-foreground/90">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-white/[0.06] pt-4 text-xs leading-5 text-emerald-300/80">
                + Legnoova AI explains the reasoning behind the analysis — so you can
                decide for yourself if it makes sense.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}