"use client";

/**
 * Client-side Paddle.js checkout.
 *
 * Loads the Paddle.js overlay only when a checkout is actually started,
 * then opens it with a priceId + customer email + userId custom data
 * obtained from our session-authed /api/billing/checkout route.
 * The client is never trusted for granting a plan — only the signed
 * webhook does that.
 */

const PADDLE_JS_SRC = "https://cdn.paddle.com/paddle/v5/paddle.js";

interface PaddleCheckoutOptions {
  items: Array<{ priceId: string; quantity: number }>;
  customer: { email: string };
  customData: Record<string, string>;
  settings: {
    displayMode: string;
    theme: string;
    successUrl?: string;
  };
}

interface PaddleGlobal {
  Environment: { set: (env: "sandbox" | "production") => void };
  Initialize: (opts: { token: string }) => void;
  Checkout: { open: (opts: PaddleCheckoutOptions) => void };
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let loadPromise: Promise<PaddleGlobal> | null = null;

function loadPaddle(): Promise<PaddleGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paddle can only load in the browser"));
  }
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PADDLE_JS_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Paddle) resolve(window.Paddle);
      else reject(new Error("Paddle.js loaded but Paddle global missing"));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Paddle.js"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export async function startCheckout(planId: "analyze" | "broker"): Promise<void> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "Could not start checkout. Please try again.");
  }

  const Paddle = await loadPaddle();
  Paddle.Environment.set(data.environment);
  Paddle.Initialize({ token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN! });
  Paddle.Checkout.open({
    items: [{ priceId: data.priceId, quantity: 1 }],
    customer: data.customer,
    customData: data.customData,
    settings: {
      displayMode: "overlay",
      theme: "dark",
      successUrl: `${window.location.origin}/app/billing?checkout=success`,
    },
  });
}
