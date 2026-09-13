"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Ruler,
  Gauge,
  Copy,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  CircleDashed,
  XCircle,
  Check,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import {
  type SignalRecord,
  type SignalStatus,
  type TookIt,
  SIGNAL_STATUSES,
} from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

function formatPrice(value: number, symbol: string): string {
  const jpy = /JPY|jpy/.test(symbol);
  return value.toFixed(jpy ? 2 : 4);
}

function pipsBetween(entry: number, stop: number, symbol: string): number | null {
  if (!Number.isFinite(entry) || !Number.isFinite(stop)) return null;
  const pipSize = /JPY|jpy/.test(symbol) ? 0.01 : 0.0001;
  const pips = Math.abs(entry - stop) / pipSize;
  return pips > 0 ? Math.round(pips * 10) / 10 : null;
}

const STATUS_META: Record<
  SignalStatus,
  { label: string; className: string }
> = {
  active: {
    label: "ACTIVE",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  tp1: {
    label: "TP1 HIT",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  tp2: {
    label: "TP2 HIT",
    className: "border-teal-500/40 bg-teal-500/10 text-teal-400",
  },
  tp3: {
    label: "TP3 HIT",
    className: "border-teal-400/50 bg-teal-400/10 text-teal-300",
  },
  stopped: {
    label: "STOPPED",
    className: "border-red-500/40 bg-red-500/10 text-red-400",
  },
  closed: {
    label: "CLOSED",
    className: "border-white/10 bg-white/[0.05] text-muted-foreground",
  },
};

function StatusBadge({ status }: { status: SignalStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide",
        meta.className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active"
            ? "animate-pulse bg-emerald-400"
            : "bg-current"
        )}
      />
      {meta.label}
    </span>
  );
}

function ChecklistIcon({ status }: { status: string }) {
  if (status === "confirmed")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (status === "failed")
    return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
  return <CircleDashed className="h-4 w-4 shrink-0 text-amber-400" />;
}

function ToneChip({ tone }: { tone: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone === "bullish"
          ? "bg-emerald-500/15 text-emerald-400"
          : tone === "bearish"
          ? "bg-red-500/15 text-red-400"
          : "bg-white/[0.06] text-muted-foreground"
      )}
    >
      {tone}
    </span>
  );
}

interface SignalCardProps {
  signal: SignalRecord;
  onUpdate?: (patch: {
    tookIt?: TookIt;
    signalStatus?: SignalStatus;
  }) => Promise<boolean>;
  market?: boolean;
}

export function SignalCard({ signal, onUpdate, market }: SignalCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const side: "buy" | "sell" = signal.direction;
  const stopPips = pipsBetween(signal.entryPrice, signal.stopLoss, signal.symbol);
  const signalNo = `#${signal.id.slice(-4).toUpperCase()}`;

  const apply = async (patch: {
    tookIt?: TookIt;
    signalStatus?: SignalStatus;
  }) => {
    if (!onUpdate || saving) return;
    setSaving(true);
    try {
      const ok = await onUpdate(patch);
      if (!ok) toast.error("Could not update signal");
    } finally {
      setSaving(false);
    }
  };

  const copySignal = async () => {
    const lines = [
      `${signal.pair || signal.symbol} · ${signal.timeframe} · ${signal.strategy}`,
      `Direction: ${signal.direction.toUpperCase()} (${signal.confidence}% confidence)`,
      `Entry: ${formatPrice(signal.entryPrice, signal.symbol)}`,
      `Stop Loss: ${formatPrice(signal.stopLoss, signal.symbol)}${stopPips ? ` (${stopPips} pips)` : ""}`,
      ...signal.takeProfits.map(
        (tp) =>
          `${tp.label}: ${formatPrice(tp.price, signal.symbol)} (R:${tp.riskReward.toFixed(1)})`
      ),
      "",
      signal.summary,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Signal copied — paste into your broker");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy signal");
    }
  };

  return (
    <div className="glass-panel overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              side === "buy"
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
            )}
          >
            {side === "buy" ? (
              <TrendingUp className="h-6 w-6" />
            ) : (
              <TrendingDown className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground/70">
                SIGNAL {signalNo}
              </span>
              <h2 className="font-heading text-xl font-bold">
                {signal.pair || signal.symbol}
              </h2>
              {signal.timeframe && (
                <span className="rounded-md border border-white/[0.1] bg-white/[0.03] px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {signal.timeframe}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{signal.strategy}</p>
              {market && (
                <span className="text-[11px] text-muted-foreground/70">
                  · community signal (anonymized)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
              side === "buy"
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : "text-red-400 border-red-500/30 bg-red-500/10"
            )}
          >
            {side === "buy" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {side === "buy" ? "BUY" : "SELL"} · {signal.confidence}%
          </span>
          <StatusBadge status={signal.signalStatus} />
          <button
            type="button"
            onClick={copySignal}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.02] text-muted-foreground transition-colors hover:border-white/[0.2] hover:text-foreground"
            aria-label="Copy signal"
            title="Copy signal"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Summary */}
      {signal.summary && (
        <div className="border-b border-white/[0.06] p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {signal.summary}
          </p>
        </div>
      )}

      {/* Levels grid */}
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <Metric
          label="Entry"
          value={formatPrice(signal.entryPrice, signal.symbol)}
          accent={side === "buy"}
          danger={side === "sell"}
        />
        <Metric
          label="Stop Loss"
          value={formatPrice(signal.stopLoss, signal.symbol)}
          danger
        />
        <Metric
          label="Stop Distance"
          value={stopPips !== null ? `${stopPips} pips` : "—"}
          icon={<Ruler className="h-3 w-3" />}
        />
        <Metric
          label="Reward:Risk"
          value={`1:${signal.riskReward?.toFixed(1) ?? "0.0"}`}
          accent
          icon={<Gauge className="h-3 w-3" />}
        />
      </div>

      {/* Take profits */}
      {signal.takeProfits.length > 0 && (
        <div className="border-t border-white/[0.06] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h3 className="font-heading text-sm font-semibold">
              Take Profit Targets{" "}
              <span className="font-normal text-muted-foreground">
                ({signal.takeProfits.length} detected)
              </span>
            </h3>
          </div>
          <div className="space-y-3">
            {signal.takeProfits.map((tp) => (
              <div
                key={tp.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                      {tp.label}
                    </div>
                    <p className="font-mono text-lg font-semibold">
                      {formatPrice(tp.price, signal.symbol)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1 font-mono text-xs text-emerald-400">
                    R:{tp.riskReward?.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{
                      width: `${Math.min(100, ((tp.riskReward ?? 0) / 3) * 100)}%`,
                    }}
                  />
                </div>
                {tp.explanation && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tp.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why this setup */}
      <div className="border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-white/[0.02]"
        >
          <span className="flex items-center gap-2 font-heading text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            Why this setup
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showWhy && "rotate-180"
            )}
          />
        </button>

        {showWhy && (
          <div className="space-y-5 px-5 pb-5">
            {signal.keyFindings && signal.keyFindings.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Key Findings
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {signal.keyFindings.map((f, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {f.label}
                        </p>
                        <ToneChip tone={f.tone} />
                      </div>
                      <p className="mt-1 text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {signal.strategyChecklist &&
              signal.strategyChecklist.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Evidence Checklist
                  </p>
                  <div className="space-y-2">
                    {signal.strategyChecklist.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2"
                      >
                        <div className="mt-0.5">
                          <ChecklistIcon status={item.status} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.point}</p>
                          {item.note && (
                            <p className="text-xs text-muted-foreground">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "ml-auto shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
                            item.status === "confirmed"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : item.status === "failed"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-amber-500/15 text-amber-400"
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {((signal.keyLevels?.support?.length ?? 0) > 0 ||
              (signal.keyLevels?.resistance?.length ?? 0) > 0) && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Key Levels
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-red-400">
                      Resistance
                    </p>
                    <div className="space-y-1">
                      {signal.keyLevels?.resistance.map((r, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-white/[0.02] px-3 py-2 font-mono text-sm"
                        >
                          {formatPrice(r, signal.symbol)}
                        </div>
                      ))}
                      {signal.keyLevels?.resistance.length === 0 && (
                        <p className="text-xs text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-emerald-400">
                      Support
                    </p>
                    <div className="space-y-1">
                      {signal.keyLevels?.support.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-white/[0.02] px-3 py-2 font-mono text-sm"
                        >
                          {formatPrice(s, signal.symbol)}
                        </div>
                      ))}
                      {signal.keyLevels?.support.length === 0 && (
                        <p className="text-xs text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {signal.strategyAssessments &&
              signal.strategyAssessments.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Strategy Read
                  </p>
                  <div className="space-y-2">
                    {signal.strategyAssessments.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {s.strategyId.replace(/-/g, " ")}
                          </p>
                          {s.note && (
                            <p className="text-xs text-muted-foreground">
                              {s.note}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                            s.verdict === "bullish"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : s.verdict === "bearish"
                              ? "bg-red-500/15 text-red-400"
                              : "bg-white/[0.06] text-muted-foreground"
                          )}
                        >
                          {s.verdict} · {s.confidence}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Journal / outcome bar */}
      {!market && onUpdate && (
        <div className="flex flex-col gap-3 border-t border-white/[0.06] bg-white/[0.01] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              I took it:
            </span>
            {(["yes", "no"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => apply({ tookIt: v })}
                disabled={saving || signal.tookIt === v}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                  signal.tookIt === v
                    ? v === "yes"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                      : "border-white/20 bg-white/[0.06] text-foreground"
                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/[0.2]"
                )}
              >
                {v === "yes" && <Check className="h-3.5 w-3.5" />}
                {v === "no" && <Minus className="h-3.5 w-3.5" />}
                {v === "yes" ? "Yes — in the trade" : "No — sat out"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Outcome:
            </span>
            <select
              value={signal.signalStatus}
              disabled={saving}
              onChange={(e) =>
                apply({ signalStatus: e.target.value as SignalStatus })
              }
              className="h-8 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2 text-xs font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {SIGNAL_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-background">
                  {s === "active"
                    ? "Still open"
                    : s === "stopped"
                    ? "Stopped out"
                    : s === "closed"
                    ? "Closed manually"
                    : `${s.toUpperCase()} hit`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Risk disclosure */}
      <div className="flex items-start gap-2 border-t border-white/[0.06] px-5 py-3">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <p className="text-xs text-muted-foreground/60">
          Legnoova AI generated analysis is for informational purposes only and
          does not constitute financial advice. You stay in control of every
          trade.
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  danger,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
      <p className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-semibold sm:text-base",
          danger ? "text-red-400" : accent ? "text-emerald-400" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}