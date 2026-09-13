"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          backgroundColor: "#0b0f0e",
          color: "#e7ece9",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          textAlign: "center",
          padding: "0 1rem",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#9aa5a0", maxWidth: "28rem" }}>
          An unexpected error occurred. Please try again — if the problem
          persists, contact us at hello@legnoova.com.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "0.75rem 1.5rem",
            background: "rgba(255,255,255,0.03)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
