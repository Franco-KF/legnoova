"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Upload, History, Star, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] || "Trader";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
          Welcome back, {name}
        </h1>
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
              Analyze a Chart
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload a screenshot and get structured AI insight
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-emerald-400 transition-transform group-hover:translate-x-1" />
      </Link>

      {/* Stats row */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4 text-emerald-400" />
            Analyses this month
          </div>
          <p className="mt-2 font-heading text-2xl font-bold">0</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-amber-400" />
            Saved setups
          </div>
          <p className="mt-2 font-heading text-2xl font-bold">0</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            Subscription
          </div>
          <p className="mt-2 font-heading text-2xl font-bold">—</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/app/history"
          className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <History className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Analysis History</h3>
            <p className="text-xs text-muted-foreground">
              View your past analyses
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
              Track setups you&apos;re interested in
            </p>
          </div>
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-12 text-center text-xs text-muted-foreground/60">
        Legnoova provides AI-generated market analysis for informational
        purposes and does not guarantee trading results.
      </p>
    </div>
  );
}