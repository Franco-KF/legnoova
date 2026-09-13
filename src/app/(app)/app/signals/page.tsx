"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, RadioTower, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignalCard } from "@/components/signals/signal-card";
import type { SignalRecord, SignalStatus, TookIt } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

type Tab = "mine" | "market";
type Filter = "all" | "active" | "profit" | "stopped";

const FILTERS: { id: Filter; label: string; match: (s: SignalRecord) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  {
    id: "active",
    label: "Active",
    match: (s) => s.signalStatus === "active",
  },
  {
    id: "profit",
    label: "In Profit",
    match: (s) =>
      s.signalStatus === "tp1" || s.signalStatus === "tp2" || s.signalStatus === "tp3",
  },
  { id: "stopped", label: "Stopped", match: (s) => s.signalStatus === "stopped" },
];

async function fetchMine(): Promise<SignalRecord[]> {
  const res = await fetch("/api/signals");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load signals");
  return data.items || [];
}

async function fetchMarket(): Promise<SignalRecord[]> {
  const res = await fetch("/api/signals/market");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load market signals");
  return data.items || [];
}

export default function SignalsPage() {
  const [tab, setTab] = useState<Tab>("mine");
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<SignalRecord[] | null>(null);
  const [market, setMarket] = useState<SignalRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (tab === "mine") {
      fetchMine()
        .then((data) => {
          if (active) setItems(data);
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : "Failed to load signals");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      fetchMarket()
        .then((data) => {
          if (active) setMarket(data);
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : "Failed to load market signals");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [tab]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setLoading(true);
    setError(null);
  };

  const onUpdate = async (id: string, patch: { tookIt?: TookIt; signalStatus?: SignalStatus }) => {
    try {
      const res = await fetch(`/api/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      if (data.signal) {
        setItems((prev) =>
          (prev || []).map((s) =>
            s.id === id
              ? {
                  ...s,
                  signalStatus: data.signal.signalStatus,
                  tookIt: data.signal.tookIt,
                }
              : s
          )
        );
      }
      return true;
    } catch {
      return false;
    }
  };

  const filtered = (items || []).filter(FILTERS.find((f) => f.id === filter)!.match);
  const shown = tab === "mine" ? filtered : market || [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Signal Desk</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Signals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every directional call Legnoova AI published from your charts — entry,
          stop-loss, targets and the evidence behind each level. Take a trade,
          then log the outcome so your track record builds.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
          {(
            [
              { id: "mine" as Tab, label: "Your Signals", icon: BellRing },
              { id: "market" as Tab, label: "Market Signals", icon: RadioTower },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                tab === t.id
                  ? "bg-emerald-500 text-emerald-950"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "mine" && (
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  filter === f.id
                    ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-300"
                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/[0.2] hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm">Loading signals…</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
            {tab === "mine" ? (
              <BellRing className="h-7 w-7 text-muted-foreground/50" />
            ) : (
              <RadioTower className="h-7 w-7 text-muted-foreground/50" />
            )}
          </div>
          <h3 className="font-heading text-lg font-semibold">
            {tab === "mine" ? "No signals yet" : "No market signals yet"}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {tab === "mine"
              ? "When you analyze a chart and Legnoova AI finds a directional edge, it gets published here as a signal."
              : "High-confidence community signals will appear here as traders scan charts."}
          </p>
          {tab === "mine" && (
            <Link
              href="/app/analyze"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Analyze a chart <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {shown.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              market={tab === "market"}
              onUpdate={
                tab === "mine"
                  ? (patch) => onUpdate(signal.id, patch)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}