"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  UploadCloud,
  ImageIcon,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  CircleDashed,
  XCircle,
  Ruler,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import {
  STRATEGIES,
  TIMEFRAMES,
  getStrategy,
  type Analysis,
  type ChecklistStatus,
  type FindingTone,
} from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024;

function normalizeMime(type: string): string {
  if (type === "image/jpg") return "image/jpeg";
  return type;
}

function formatPrice(value: number, pair: string): string {
  const jpy = /JPY|jpy/.test(pair);
  return value.toFixed(jpy ? 2 : 4);
}

function pipsBetween(entry: number, stop: number, symbol: string): number | null {
  if (!Number.isFinite(entry) || !Number.isFinite(stop)) return null;
  const pipSize = /JPY|jpy/.test(symbol) ? 0.01 : 0.0001;
  const pips = Math.abs(entry - stop) / pipSize;
  return pips > 0 ? Math.round(pips * 10) / 10 : null;
}

function ConfidencePill({ value, side }: { value: number; side: "buy" | "sell" }) {
  const color =
    side === "buy"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        color
      )}
    >
      {side === "buy" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      {side === "buy" ? "BUY" : "SELL"} · {value}%
    </span>
  );
}

function ChecklistStatusIcon({ status }: { status: ChecklistStatus }) {
  if (status === "confirmed")
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (status === "failed")
    return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
  return <CircleDashed className="h-4 w-4 shrink-0 text-amber-400" />;
}

function FindingToneChip({ tone }: { tone: FindingTone }) {
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

export default function AnalyzePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [symbolHint, setSymbolHint] = useState("");
  const [timeframe, setTimeframe] = useState<string>("H1");
  const [strategyId, setStrategyId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const strategy = getStrategy(strategyId);

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Use PNG, JPEG, WEBP or GIF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image is too large (max 8MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = String(e.target?.result || "").split(",")[1] || "";
      setImageBase64(base64);
      setMimeType(normalizeMime(file.type));
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearImage = useCallback(() => {
    setImageBase64("");
    setMimeType("");
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          mimeType,
          symbolHint,
          timeframe,
          strategy: strategyId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }
      setResult(data.analysis as Analysis);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = !!imageBase64 && !loading;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Analyse Panel</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
          Chart Analysis
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload a chart screenshot, pick your strategy and the AI reads the
          market through that exact lens — structure, zones and risk-aware
          entry, stop-loss and dynamic take-profit targets.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* LEFT — Upload + strategy + options */}
        <div className="space-y-5">
          {/* Upload zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all",
              dragActive
                ? "border-emerald-400/70 bg-emerald-500/10"
                : "border-white/[0.12] bg-white/[0.02] hover:border-emerald-400/50 hover:bg-white/[0.04]"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {previewUrl ? (
              <div className="relative">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                  <Image
                    src={previewUrl}
                    alt="Chart preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearImage();
                  }}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white transition-colors hover:bg-black/90"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Click to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
                  <UploadCloud className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="font-heading text-base font-semibold">
                  Drop your chart here or click to upload
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PNG, JPEG, WEBP or GIF · up to 8MB
                </p>
              </div>
            )}
          </div>

          {/* Strategy picker */}
          <div className="glass-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                <h2 className="font-heading text-sm font-semibold">
                  Strategy
                </h2>
              </div>
              <span className="text-[11px] text-muted-foreground">
                The AI analyses through your chosen lens
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategyId(s.id)}
                  className={cn(
                    "rounded-xl border p-2.5 text-left transition-all",
                    strategyId === s.id
                      ? "border-emerald-400/60 bg-emerald-500/10 shadow-glow-emerald"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide",
                      strategyId === s.id
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/[0.06] text-muted-foreground"
                    )}
                  >
                    {s.short}
                  </span>
                  <p className="mt-1.5 text-xs font-semibold leading-tight">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {s.tagline}
                  </p>
                </button>
              ))}
            </div>

            {/* Dynamic focus strip — changes with the selected strategy */}
            <div
              key={strategy.id}
              className="animate-fade-in-up mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {strategy.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {strategy.checklist.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeframe + symbol */}
          <div className="glass-panel space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Chart timeframe
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-mono font-medium transition-all",
                      timeframe === tf.id
                        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                        : "border-white/[0.1] bg-white/[0.02] text-muted-foreground hover:border-white/[0.2] hover:text-foreground"
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="symbol"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Pair / symbol (optional)
              </label>
              <input
                id="symbol"
                type="text"
                value={symbolHint}
                onChange={(e) => setSymbolHint(e.target.value)}
                placeholder="e.g. EURUSD"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Analyze button */}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
              canAnalyze
                ? "bg-emerald-500 text-emerald-950 shadow-glow-emerald hover:bg-emerald-400"
                : "cursor-not-allowed bg-white/[0.06] text-muted-foreground"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing with {strategy.label}…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {canAnalyze ? `Analyse with ${strategy.label}` : "Upload a chart to analyze"}
              </>
            )}
          </button>
        </div>

        {/* RIGHT — Results */}
        <div>
          {loading ? (
            <ResultSkeleton strategy={strategy} />
          ) : result ? (
            <ResultPanel analysis={result} />
          ) : (
            <Placeholder strategy={strategy} />
          )}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ strategy }: { strategy: ReturnType<typeof getStrategy> }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.01] p-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-muted-foreground">
        No analysis yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground/70">
        Upload a chart to get a {strategy.label} signal — including dynamic
        take-profit targets (TP1, TP2 and up to TP3) and a full evidence
        checklist.
      </p>
      <div className="mt-5 w-full max-w-xs space-y-1.5 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
          What we&apos;ll look for — {strategy.short}
        </p>
        {strategy.checklist.map((point) => (
          <div
            key={point}
            className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground"
          >
            <CircleDashed className="h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultSkeleton({ strategy }: { strategy: ReturnType<typeof getStrategy> }) {
  const steps = [
    `Reading ${strategy.label}…`,
    ...strategy.checklist.map((c) => `Checking: ${c}…`),
    "Scoring confidence…",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => (s + 1) % steps.length),
      1600
    );
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="glass-panel animate-pulse space-y-4 p-6">
        <div className="h-6 w-40 rounded bg-white/[0.06]" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/[0.06]" />
          <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="h-20 rounded-xl bg-white/[0.06]" />
          <div className="h-20 rounded-xl bg-white/[0.06]" />
          <div className="h-20 rounded-xl bg-white/[0.06]" />
          <div className="h-20 rounded-xl bg-white/[0.06]" />
        </div>
        <div className="h-36 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span key={step} className="animate-fade-in-up">
          {steps[step]}
        </span>
      </div>
    </div>
  );
}

function ResultPanel({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false);
  const neutral =
    analysis.direction === "neutral" || analysis.takeProfits.length === 0;
  const side = neutral ? "neutral" : analysis.direction;
  const stopPips = neutral
    ? null
    : pipsBetween(analysis.entryPrice, analysis.stopLoss, analysis.symbol);

  const copySignal = async () => {
    const lines = [
      `${analysis.pair || analysis.symbol} · ${analysis.timeframe} · ${analysis.strategy}`,
      `Direction: ${analysis.direction.toUpperCase()} (${analysis.confidence}% confidence)`,
      neutral ? null : `Entry: ${formatPrice(analysis.entryPrice, analysis.symbol)}`,
      neutral ? null : `Stop Loss: ${formatPrice(analysis.stopLoss, analysis.symbol)}${stopPips ? ` (${stopPips} pips)` : ""}`,
      ...analysis.takeProfits.map(
        (tp) =>
          `${tp.label}: ${formatPrice(tp.price, analysis.symbol)} (R:${tp.riskReward.toFixed(1)})`
      ),
      "",
      analysis.summary,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Signal copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy signal");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="glass-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                side === "buy"
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                  : side === "sell"
                  ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                  : "bg-white/[0.04] text-muted-foreground ring-1 ring-white/10"
              )}
            >
              {side === "buy" ? (
                <TrendingUp className="h-6 w-6" />
              ) : side === "sell" ? (
                <TrendingDown className="h-6 w-6" />
              ) : (
                <Minus className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold">
                  {analysis.pair || analysis.symbol}
                </h2>
                {analysis.timeframe && (
                  <span className="rounded-md border border-white/[0.1] bg-white/[0.03] px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {analysis.timeframe}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{analysis.strategy}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!neutral && (
              <ConfidencePill
                value={analysis.confidence}
                side={analysis.direction as "buy" | "sell"}
              />
            )}
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
        {analysis.summary && (
          <div className="border-b border-white/[0.06] p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          </div>
        )}

        {/* Entry / SL / pips / R:R */}
        {!neutral && (
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            <Metric
              label="Entry"
              value={formatPrice(analysis.entryPrice, analysis.symbol)}
              accent
            />
            <Metric
              label="Stop Loss"
              value={formatPrice(analysis.stopLoss, analysis.symbol)}
              danger
            />
            <Metric
              label="Stop Distance"
              value={stopPips !== null ? `${stopPips} pips` : "—"}
              icon={<Ruler className="h-3 w-3" />}
            />
            <Metric
              label="Risk:Reward"
              value={`1:${analysis.riskReward?.toFixed(1) ?? "0.0"}`}
              accent
              icon={<Gauge className="h-3 w-3" />}
            />
          </div>
        )}
      </div>

      {/* Take profits — DYNAMIC count with R-multiple bars */}
      {!neutral && (
        <div className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h3 className="font-heading text-sm font-semibold">
              Take Profit Targets{" "}
              <span className="font-normal text-muted-foreground">
                ({analysis.takeProfits.length} detected)
              </span>
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.takeProfits.map((tp) => (
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
                      {formatPrice(tp.price, analysis.symbol)}
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
                      width: `${Math.min(100, (tp.riskReward / 3) * 100)}%`,
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

      {/* Neutral message */}
      {neutral && (
        <div className="glass-panel p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-amber-400" />
          <h3 className="font-heading text-lg font-semibold">No clear setup</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            The AI didn&apos;t find a high-probability trade in this chart
            through the {analysis.strategy} lens. This is a risk-first result —
            better to sit out than force a trade.
          </p>
        </div>
      )}

      {/* Strategy-specific findings */}
      {analysis.keyFindings && analysis.keyFindings.length > 0 && (
        <div className="glass-panel p-5">
          <h3 className="mb-3 font-heading text-sm font-semibold">
            Key Findings
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.keyFindings.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </p>
                  <FindingToneChip tone={f.tone} />
                </div>
                <p className="mt-1 text-sm">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy checklist — dynamic per strategy */}
      {analysis.strategyChecklist && analysis.strategyChecklist.length > 0 && (
        <div className="glass-panel p-5">
          <h3 className="mb-3 font-heading text-sm font-semibold">
            Evidence Checklist
          </h3>
          <div className="space-y-2">
            {analysis.strategyChecklist.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2"
              >
                <div className="mt-0.5">
                  <ChecklistStatusIcon status={item.status} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.point}</p>
                  {item.note && (
                    <p className="text-xs text-muted-foreground">{item.note}</p>
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

      {/* Key levels */}
      {(analysis.keyLevels?.support?.length > 0 ||
        analysis.keyLevels?.resistance?.length > 0) && (
        <div className="glass-panel p-5">
          <h3 className="mb-3 font-heading text-sm font-semibold">Key Levels</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-red-400">Resistance</p>
              <div className="space-y-1">
                {analysis.keyLevels.resistance.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                  >
                    <span className="font-mono text-sm">
                      {formatPrice(r, analysis.symbol)}
                    </span>
                  </div>
                ))}
                {analysis.keyLevels.resistance.length === 0 && (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-emerald-400">Support</p>
              <div className="space-y-1">
                {analysis.keyLevels.support.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
                  >
                    <span className="font-mono text-sm">
                      {formatPrice(s, analysis.symbol)}
                    </span>
                  </div>
                ))}
                {analysis.keyLevels.support.length === 0 && (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy assessment (consensus mode) */}
      {analysis.strategyAssessments &&
        analysis.strategyAssessments.length > 0 && (
          <div className="glass-panel p-5">
            <h3 className="mb-3 font-heading text-sm font-semibold">
              Strategy Read
            </h3>
            <div className="space-y-2">
              {analysis.strategyAssessments.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {s.strategyId.replace(/-/g, " ")}
                    </p>
                    {s.note && (
                      <p className="text-xs text-muted-foreground">{s.note}</p>
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

      {/* Risk disclosure */}
      {analysis.riskDisclosure && (
        <p className="flex items-start gap-2 px-2 text-xs text-muted-foreground/60">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {analysis.riskDisclosure}
        </p>
      )}
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
