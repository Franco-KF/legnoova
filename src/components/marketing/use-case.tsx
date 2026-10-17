import { Check, MessageCircleQuestion } from "lucide-react";

const checks = [
  { label: "Is price moving up, down or sideways?" },
  { label: "Where has price turned before?" },
  { label: "What areas may matter next?" },
  { label: "Where might a trade start?" },
  { label: "Where could the idea be wrong?" },
  { label: "Where might you take profit?" },
  { label: "What if price moves the other way?" },
  { label: "What should you check before you act?" },
];

export function UseCase() {
  return (
    <section id="use-case" className="border-t border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left: narrative */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Whether You Are New or Experienced
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Start With a Clearer View.
              <br className="hidden sm:block" />
              <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Check Your Next Move.
              </span>
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              New to forex? Get help making sense of your chart. Been trading
              for years? Get another view before you act.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Upload a screenshot, see what stands out and choose your next
              step. Keep learning and managing risk—no tool can do that for you.
            </p>

            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5 text-emerald-400" />
                <span className="font-heading text-sm font-semibold">
                  Start here: “What should I notice on this chart?”
                </span>
              </div>
            </div>
          </div>

          {/* Right: checklist */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h3 className="font-heading text-lg font-semibold">
              Get help checking:
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
