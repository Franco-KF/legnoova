"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Upload,
  History,
  Star,
  ShieldCheck,
  BellRing,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface SignalStats {
  totalSignals: number;
  signalsThisMonth: number;
  activeSignals: number;
  aiWinRate: number | null;
  yourWinRate: number | null;
  signalsTraded: number;
  closedSignals: number;
}

function fmtRate(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SignalStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/signals/stats");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setStats(data.stats as SignalStats);
      } catch {
        /* keep dashboard resilient */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const name = session?.user?.name?.split(" ")[0] || "Trader";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const aiRate = stats?.aiWinRate ?? null;
  const yourRate = stats?.yourWinRate ?? null;
  const hasRecord = stats && (stats.closedSignals > 0 || (stats.signalsTraded || 0) > 0);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
          Welcome back, {name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Here is what Legnoova AI is currently calling across your charts.
        </p>
      </div>

      {/* Primary CTA */}
      <Link
        href="/app/analyze"
        className="group mb-10 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-6 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/[0.12] sm:p-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Upload className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Analyze a Chart — Get a Signal
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload a screenshot and Legnoova AI publishes a structured signal
              with entry, stop-loss and targets
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-emerald-400 transition-transform group-hover:translate-x-1" />
      </Link>

      {!stats ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm">Loading your signal desk…</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellRing className="h-4 w-4 text-emerald-400" />
                Active Signals
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">
                {stats.activeSignals}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                open setups not yet closed
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Signals This Month
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">
                {stats.signalsThisMonth}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                of {stats.totalSignals} total published
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-emerald-400" />
                AI Hit Rate
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">
                {fmtRate(aiRate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                signals reaching TP1+ (reported)
              </p>
            </div>
          </div>

          {/* You vs Legnoova AI */}
          <div className="mb-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-400" />
                  <h2 className="font-heading text-lg font-semibold">
                    Your Track Record vs Legnoova AI
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  How the AI&apos;s setups compare to the trades you actually
                  take — based on reported outcomes.
                </p>
              </div>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
                {stats.signalsTraded} trades logged
              </span>
            </div>

            {hasRecord ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">Legnoova AI hit rate</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {fmtRate(aiRate)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                      style={{ width: `${Math.min(100, aiRate ?? 0)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground/70">
                    {stats.closedSignals} closed signals
                  </p>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">Your hit rate</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {fmtRate(yourRate)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                      style={{ width: `${Math.min(100, yourRate ?? 0)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground/70">
                    {stats.signalsTraded} trades you took
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No closed signals yet. Take a signal in your feed, then set
                  the outcome (TP1/TP2/TP3 hit or stopped out) — your hit rate
                  builds from there.
                </p>
                <Link
                  href="/app/signals"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
                >
                  Open Signals <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/app/signals"
          className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <BellRing className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Signals</h3>
            <p className="text-xs text-muted-foreground">
              Your feed + the community&apos;s high-confidence calls
            </p>
          </div>
        </Link>
        <Link
          href="/app/history"
          className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">History</h3>
            <p className="text-xs text-muted-foreground">
              Every chart you&apos;ve analyzed
            </p>
          </div>
        </Link>
        <Link
          href="/app/watchlist"
          className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <Star className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Watchlist</h3>
            <p className="text-xs text-muted-foreground">
              Setups you&apos;re tracking across the market
            </p>
          </div>
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-12 text-center text-xs text-muted-foreground/60">
        Legnoova AI provides signals for informational purposes and does not
        guarantee trading results. You stay in control of every trade.
      </p>
    </div>
  );
}