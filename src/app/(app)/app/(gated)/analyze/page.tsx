"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  UploadCloud,
  ImageIcon,
  X,
  Loader2,
  Target,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  STRATEGIES,
  TIMEFRAMES,
  getStrategy,
  type Analysis,
  type SignalRecord,
  type SignalStatus,
  type TookIt,
} from "@/lib/analysis/types";
import { SignalCard } from "@/components/signals/signal-card";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024;

function normalizeMime(type: string): string {
  if (type === "image/jpg") return "image/jpeg";
  return type;
}

const MAX_DIMENSION = 1600;

function prepareImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const inputMime = normalizeMime(file.type);
    const isGif = inputMime === "image/gif";
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
        );
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas is not supported in this browser.");
        }
        ctx.drawImage(image, 0, 0, width, height);

        // GIF becomes a static frame (Gemini rejects animated images);
        // everything else keeps its format, just downscaled.
        const outputMime = isGif ? "image/jpeg" : inputMime;
        const dataUrl = canvas.toDataURL(
          outputMime === "image/png" ? "image/png" : "image/jpeg",
          0.9
        );
        resolve({
          base64: String(dataUrl.split(",")[1] || ""),
          mimeType: outputMime === "image/png" ? "image/png" : "image/jpeg",
        });
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image file."));
    };

    image.src = url;
  });
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
  const [signalId, setSignalId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const strategy = getStrategy(strategyId);

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Use PNG, JPEG, WEBP or GIF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image is too large (max 8MB).");
      return;
    }

    try {
      const prepared = await prepareImage(file);
      setImageBase64(prepared.base64);
      setMimeType(prepared.mimeType);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read the image file."
      );
    }
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
    setSignalId(null);
    setCreatedAt(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setResult(null);
    setSignalId(null);
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
      setSignalId((data.id as string) || null);
      setCreatedAt((data.createdAt as string) || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSignalUpdate = async (patch: {
    tookIt?: TookIt;
    signalStatus?: SignalStatus;
  }) => {
    if (!signalId) return false;
    try {
      const res = await fetch(`/api/signals/${signalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      if (data.signal) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                signalStatus: data.signal.signalStatus,
                tookIt: data.signal.tookIt,
              }
            : prev
        );
      }
      toast.success(
        patch.tookIt
          ? patch.tookIt === "yes"
            ? "Logged — you're in this trade"
            : "Logged — you sat this one out"
          : "Outcome updated"
      );
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
      return false;
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
          Pick a chart, choose your strategy lens and timeframe — Legnoova AI
          returns a structured signal with entry, stop-loss and take-profit
          targets.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* LEFT — Upload + strategy + options */}
        <div className="space-y-5">
          {/* Step 1 — Choose chart */}
          <div className="glass-panel p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                1
              </span>
              <h2 className="font-heading text-sm font-semibold">
                Choose chart
              </h2>
              <span className="ml-auto text-[11px] text-muted-foreground">
                PNG · JPEG · WEBP · GIF
              </span>
            </div>
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
          </div>

          {/* Step 2 — Choose strategy */}
          <div className="glass-panel p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                2
              </span>
              <h2 className="font-heading text-sm font-semibold">
                Choose strategy
              </h2>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {strategy.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategyId(s.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition-all",
                    strategyId === s.id
                      ? "border-emerald-400/60 bg-emerald-500/10 shadow-glow-emerald"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      strategyId === s.id
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/[0.06] text-muted-foreground"
                    )}
                  >
                    {s.short}
                  </span>
                  <span className="text-[11px] font-semibold leading-tight">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — Set timeframe */}
          <div className="glass-panel p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                3
              </span>
              <h2 className="font-heading text-sm font-semibold">
                Set timeframe
              </h2>
            </div>
            <div>
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
                Analysing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {canAnalyze ? "Analyse chart" : "Upload a chart first"}
              </>
            )}
          </button>
        </div>

        {/* RIGHT — Results */}
        <div>
          {loading ? (
            <ResultSkeleton strategy={strategy} />
          ) : result ? (
            result.direction === "neutral" ? (
              <NeutralResult analysis={result} />
            ) : (
              <SignalCard
                signal={toSignalRecord(result, signalId, createdAt)}
                onUpdate={onSignalUpdate}
              />
            )
          ) : (
            <Placeholder strategy={strategy} />
          )}
        </div>
      </div>
    </div>
  );
}

function toSignalRecord(
  analysis: Analysis,
  id: string | null,
  createdAt: string | null
): SignalRecord {
  return {
    id: id || "fresh",
    pair: analysis.pair,
    symbol: analysis.symbol,
    timeframe: analysis.timeframe,
    direction: analysis.direction as "buy" | "sell",
    entryPrice: analysis.entryPrice,
    stopLoss: analysis.stopLoss,
    takeProfits: analysis.takeProfits || [],
    riskReward: analysis.riskReward,
    confidence: analysis.confidence,
    strategy: analysis.strategy,
    summary: analysis.summary,
    keyFindings: analysis.keyFindings,
    strategyChecklist: analysis.strategyChecklist,
    keyLevels: analysis.keyLevels,
    strategyAssessments: analysis.strategyAssessments,
    signalStatus: analysis.signalStatus || "active",
    tookIt: analysis.tookIt || "unset",
    published: analysis.published,
    createdAt,
  };
}

function NeutralResult({ analysis }: { analysis: Analysis }) {
  return (
    <div className="glass-panel animate-fade-in-up p-6 text-center">
      <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-amber-400" />
      <h3 className="font-heading text-lg font-semibold">No Trade — sit out</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Through the {analysis.strategy} lens, Legnoova AI couldn&apos;t find a
        high-probability setup in this chart. No signal is published — this is a
        risk-first result. Better to sit out than force a trade.
      </p>
      {analysis.summary && (
        <p className="mx-auto mt-4 max-w-md rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-muted-foreground">
          {analysis.summary}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground/60">
        Legnoova AI generated analysis is for informational purposes only and
        does not constitute financial advice.
      </p>
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
        No signal yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground/70">
        Upload a chart to get a {strategy.label} signal — a tradable setup with
        entry, stop-loss, dynamic take-profit targets (TP1, TP2 and up to TP3)
        and the full evidence behind it. No signal if there&apos;s no edge.
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
            <Target className="h-3.5 w-3.5 shrink-0 text-emerald-400/60" />
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
