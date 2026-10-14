"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
  id: string;
  pair: string;
  symbol: string;
  timeframe: string;
  direction: "buy" | "sell";
  entryPrice: number;
  stopLoss: number;
  takeProfits: { price: number; label: string }[];
  confidence: number;
  strategy: string;
  summary: string;
  riskReward: number;
  createdAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(value: number, symbol: string): string {
  const jpy = /JPY|jpy/.test(symbol);
  return value.toFixed(jpy ? 2 : 4);
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load history");
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
          Analysis History
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every chart you&apos;ve analysed, stored for review.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm">Loading your analyses…</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
            <HistoryIcon className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="font-heading text-lg font-semibold">No analyses yet</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Upload your first chart in the Analyse panel and it will appear here.
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
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    item.direction === "buy"
                      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                  )}
                >
                  {item.direction === "buy" ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-base font-bold">{item.symbol}</p>
                    <span className="rounded-md border border-white/[0.1] bg-white/[0.03] px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {item.timeframe}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 sm:justify-items-end">
                <Info label="Entry" value={formatPrice(item.entryPrice, item.symbol)} />
                <Info label="Stop" value={formatPrice(item.stopLoss, item.symbol)} danger />
                <Info
                  label="R:R"
                  value={`1:${(item.riskReward ?? 0).toFixed(1)}`}
                />
                <Info
                  label="Confidence"
                  value={`${item.confidence}%`}
                  accent={item.direction === "buy"}
                  danger={item.direction === "sell"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold",
          danger ? "text-red-400" : accent ? "text-emerald-400" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
