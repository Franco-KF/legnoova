"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistEntry {
  symbol: string;
  pair: string;
  timeframe: string;
  direction: "buy" | "sell";
  entryPrice: number;
  takeProfits?: number[];
  stopLoss?: number;
  note?: string;
}

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/watchlist");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load watchlist");
        setEntries(data.watchlist?.entries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addCurrentAnalysis = async () => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry: {
            symbol: "EURUSD",
            pair: "EUR/USD",
            timeframe: "H1",
            direction: "buy",
            entryPrice: 1.0845,
            takeProfits: [1.0895, 1.0945],
            stopLoss: 1.0795,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setEntries((prev) => [
        ...(prev || []),
        {
          symbol: "EURUSD",
          pair: "EUR/USD",
          timeframe: "H1",
          direction: "buy",
          entryPrice: 1.0845,
          takeProfits: [1.0895, 1.0945],
          stopLoss: 1.0795,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Watchlist</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Setups you&apos;re tracking across the market.
          </p>
        </div>
        <button
          onClick={addCurrentAnalysis}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm">Loading your watchlist…</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
            <Star className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="font-heading text-lg font-semibold">Your watchlist is empty</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Add signals you want to keep an eye on, or analyse a chart to get one.
          </p>
          <Link
            href="/app/analyze"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
          >
            Analyse a chart <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="glass-panel flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center"
            >
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  entry.direction === "buy"
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                )}
              >
                {entry.direction === "buy" ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-base font-bold">{entry.symbol}</p>
                  <span className="rounded-md border border-white/[0.1] bg-white/[0.03] px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {entry.timeframe}
                  </span>
                </div>
                {entry.note && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                )}
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 sm:justify-end">
                <span className="font-mono text-sm">E: {entry.entryPrice.toFixed(4)}</span>
                {entry.stopLoss && (
                  <span className="font-mono text-sm text-red-400">S: {entry.stopLoss.toFixed(4)}</span>
                )}
                <div className="flex items-center gap-1.5">
                  {entry.takeProfits?.map((tp, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400 ring-1 ring-emerald-500/20"
                    >
                      TP{i + 1} {tp.toFixed(4)}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-muted-foreground transition-colors hover:text-red-400"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
