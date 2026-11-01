import { BarChart3, CandlestickChart, LineChart, ShieldCheck } from "lucide-react";

const audiences = [
  { icon: CandlestickChart, label: "Price action traders", detail: "Clearer chart reviews" },
  { icon: LineChart, label: "Technical traders", detail: "Structure and key levels" },
  { icon: BarChart3, label: "MT5 traders", detail: "Demo-first automation" },
  { icon: ShieldCheck, label: "Risk-focused traders", detail: "Rules before execution" },
];

/** Avoids unverified endorsements or third-party images/logos. */
export function TraderCommunity() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015] py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:px-8">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Built for the trading community</p>
          <p className="mt-2 text-sm text-muted-foreground">One clear workflow for traders who want evidence, structure and control.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
          {audiences.map(({ icon: Icon, label, detail }) => (
            <div key={label} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0"><strong className="block truncate text-xs font-semibold">{label}</strong><small className="block truncate text-[10px] text-muted-foreground">{detail}</small></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
