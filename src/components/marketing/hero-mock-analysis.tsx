"use client";

import {
  ArrowUp,
  CircleDot,
  TrendingUp,
} from "lucide-react";

export function HeroMockAnalysis() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Glow behind the card */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl" />

      <div className="glass-panel overflow-hidden shadow-2xl">
        {/* Terminal top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              Legnoova Analysis Terminal
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              Analysis Complete
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-4 p-5 md:grid-cols-[1.2fr_1fr]">
          {/* Left: Chart visual */}
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 p-4">
            <div className="grid-bg-pattern absolute inset-0 opacity-60" />

            {/* Chart line */}
            <svg
              viewBox="0 0 400 220"
              className="relative w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(52,211,153,0.25)" />
                  <stop offset="100%" stopColor="rgba(52,211,153,0)" />
                </linearGradient>
                <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[40, 80, 120, 160].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="400"
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill */}
              <path
                d="M0,180 C30,170 45,140 70,145 C95,150 110,110 140,115 C170,120 185,90 215,85 C245,80 260,60 290,65 C320,70 335,45 360,40 C375,37 390,50 400,45 L400,220 L0,220 Z"
                fill="url(#chartFill)"
              />

              {/* Line */}
              <path
                d="M0,180 C30,170 45,140 70,145 C95,150 110,110 140,115 C170,120 185,90 215,85 C245,80 260,60 290,65 C320,70 335,45 360,40 C375,37 390,50 400,45"
                fill="none"
                stroke="url(#chartStroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Candlesticks */}
              {[
                { x: 60, o: 155, c: 142, h: 132, l: 165 },
                { x: 120, o: 142, c: 128, h: 120, l: 152 },
                { x: 180, o: 128, c: 112, h: 104, l: 138 },
                { x: 240, o: 112, c: 98, h: 90, l: 122 },
                { x: 300, o: 98, c: 80, h: 72, l: 108 },
                { x: 360, o: 80, c: 63, h: 55, l: 90 },
              ].map((c, i) => {
                const isUp = c.c < c.o;
                const color = isUp ? "#34d399" : "#f87171";
                const bodyY = Math.min(c.o, c.c);
                const bodyH = Math.abs(c.o - c.c);
                return (
                  <g key={i}>
                    <line
                      x1={c.x}
                      y1={c.h}
                      x2={c.x}
                      y2={c.l}
                      stroke={color}
                      strokeWidth="1.5"
                    />
                    <rect
                      x={c.x - 4}
                      y={bodyY}
                      width="8"
                      height={Math.max(bodyH, 3)}
                      rx="1"
                      fill={color}
                    />
                  </g>
                );
              })}

              {/* Support / resistance lines */}
              <line
                x1="0"
                y1="90"
                x2="400"
                y2="90"
                stroke="rgba(251,191,36,0.3)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1="0"
                y1="150"
                x2="400"
                y2="150"
                stroke="rgba(251,191,36,0.3)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Entry marker */}
              <circle cx="300" cy="85" r="5" fill="#f59e0b" className="opacity-90" />
            </svg>

            {/* Price labels */}
            <div className="absolute left-4 top-4 space-y-1 font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400/80">R:</span> 1.0850
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400/80">S:</span> 1.0775
              </div>
            </div>

            {/* Current price chip */}
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
              <span className="font-mono text-sm font-semibold text-emerald-400">
                1.0824
              </span>
              <span className="flex items-center text-xs font-medium text-emerald-400">
                <ArrowUp className="h-3 w-3" /> 0.24%
              </span>
            </div>
          </div>

          {/* Right: Analysis data */}
          <div className="flex flex-col gap-3">
            {/* Signal header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-base font-bold">EUR/USD</span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    H1
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Market Bias: Bullish
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 ring-1 ring-emerald-500/40">
                <ArrowUp className="h-4 w-4 text-emerald-400" />
                <span className="font-heading text-lg font-bold tracking-wide text-emerald-400">
                  BUY
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
                  Consensus Confidence
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  78%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  style={{ width: "78%" }}
                />
              </div>
            </div>

            {/* Setup levels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Entry Zone
                </p>
                <p className="mt-1 font-mono text-sm font-semibold">
                  1.0800 – 1.0815
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Stop Loss
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-red-400">
                  1.0770
                </p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-red-400/70">
                  Take Profit 1
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-red-300">
                  1.0850
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                  Take Profit 2
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-300">
                  1.0890
                </p>
              </div>
            </div>

            {/* Risk reward */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Risk / Reward
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                1 : 2.4
              </span>
            </div>

            {/* Strategies */}
            <div className="space-y-1.5">
              {[
                { name: "Price Action", sig: "BUY", conf: 82 },
                { name: "Market Structure", sig: "BUY", conf: 75 },
                { name: "Support & Resistance", sig: "BUY", conf: 70 },
                { name: "Trend Following", sig: "WAIT", conf: 55 },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {s.conf}%
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        s.sig === "BUY"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {s.sig}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
