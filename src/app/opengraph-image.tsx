import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt =
  "Legnoova AI — Your forex analysis, supercharged by AI. Upload your chart and get an AI second opinion before you trade.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const BARS = [
  { x: 250, y: 368, w: 150, h: 96, o: 0.7 },
  { x: 480, y: 318, w: 150, h: 150, o: 0.85 },
  { x: 710, y: 246, w: 150, h: 222, o: 1 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#070e0b",
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        padding: "72px",
        position: "relative",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 560,
          height: 560,
          borderRadius: 9999,
          background:
            "radial-gradient(circle, rgba(16,185,129,0.35), rgba(16,185,129,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -180,
          left: -120,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.22), rgba(34,211,238,0) 70%)",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #34d399, #0d9488)",
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="4.5" y="20" width="6.5" height="8" rx="2" fill="#022c22" opacity="0.7" />
            <rect x="12.75" y="15" width="6.5" height="13" rx="2" fill="#022c22" opacity="0.85" />
            <rect x="21" y="9" width="6.5" height="19" rx="2" fill="#022c22" />
            <circle cx="24.5" cy="6.2" r="2.3" fill="#022c22" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 800,
            color: "#f5f5f4",
            letterSpacing: -1,
          }}
        >
          Legnoova{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(90deg, #34d399, #22d3ee)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AI
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flexGrow: 1 }} />

      {/* Headline */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              color: "#f5f5f4",
              maxWidth: 760,
            }}
          >
            Your Forex Analysis,{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #34d399, #2dd4bf, #22d3ee)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Supercharged
            </span>{" "}
            by AI.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#9ca3af",
              maxWidth: 680,
              lineHeight: 1.4,
            }}
          >
            Upload your chart. Get an independent AI read on trend, structure,
            key levels and setups — before you trade.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 26,
              color: "#34d399",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 99,
                backgroundColor: "#34d399",
              }}
            />
            Before you trade, ask Legnoova AI.
          </div>
        </div>

        {/* Chart bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 80,
            height: 386,
            paddingLeft: 16,
          }}
        >
          {BARS.map((b) => (
            <div key={b.x} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20 }}>
              <div
                style={{
                  width: b.w,
                  height: b.h,
                  borderRadius: 24,
                  background:
                    "linear-gradient(180deg, #34d399, #0d9488)",
                  opacity: b.o,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Divider + tagline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ height: 2, width: "100%", backgroundColor: "rgba(255,255,255,0.08)" }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#6b7280",
            letterSpacing: 0.5,
          }}
        >
          <span>{siteConfig.name}</span>
          <span>AI second opinion for forex traders</span>
        </div>
      </div>
    </div>
    ),
    size,
  );
}