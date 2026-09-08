import { Check, MessageCircleQuestion } from "lucide-react";

const checks = [
  { label: "Trend direction" },
  { label: "Market structure" },
  { label: "Key price levels" },
  { label: "Potential entry zones" },
  { label: "Stop Loss placement" },
  { label: "Take Profit targets" },
  { label: "Bullish vs bearish scenarios" },
  { label: "Potential weaknesses in your setup" },
];

export function UseCase() {
  return (
    <section id="use-case" className="border-t border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left: narrative */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Before You Enter a Trade
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Before You Enter a Trade...
              <br className="hidden sm:block" />
              <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Ask Legnoova AI.
              </span>
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Upload your chart and get another perspective on the things that
              matter most. One more perspective could stop you from taking a
              trade you shouldn&apos;t take.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              No setup. No manual inputs to configure. Just your chart — and a
              second, independent read before you commit.
            </p>

            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5 text-emerald-400" />
                <span className="font-heading text-sm font-semibold">
                  Just ask: “Does my analysis make sense?”
                </span>
              </div>
            </div>
          </div>

          {/* Right: checklist */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h3 className="font-heading text-lg font-semibold">
              Get another perspective on:
            </h3>
            <ul className="mt-6 space-y-3.5">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className="flex items-center gap-3 text-sm text-foreground/80"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}