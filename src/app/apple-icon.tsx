import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08130f",
        }}
      >
        <svg
          width="112"
          height="112"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="m"
              x1="0"
              y1="32"
              x2="32"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#34d399" />
              <stop offset="0.55" stopColor="#2dd4bf" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <rect
            x="4.5"
            y="20"
            width="6.5"
            height="8"
            rx="2"
            fill="url(#m)"
            opacity="0.7"
          />
          <rect
            x="12.75"
            y="15"
            width="6.5"
            height="13"
            rx="2"
            fill="url(#m)"
            opacity="0.85"
          />
          <rect
            x="21"
            y="9"
            width="6.5"
            height="19"
            rx="2"
            fill="url(#m)"
          />
          <circle cx="24.5" cy="6.2" r="2.3" fill="#a7f3d0" />
        </svg>
      </div>
    ),
    size,
  );
}