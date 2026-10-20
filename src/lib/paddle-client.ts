"use client";

/**
 * Client-side Paddle.js inline checkout.
 *
 * Loads Paddle.js only when checkout is actually started,
 * then opens it with a priceId + customer email + userId custom data
 * obtained from our session-authed /api/billing/checkout route.
 * The client is never trusted for granting a plan — only the signed
 * webhook does that.
 */

const PADDLE_JS_SRC = "https://cdn.paddle.com/paddle/v2/paddle.js";

interface PaddleCheckoutOptions {
  items: Array<{ priceId: string; quantity: number }>;
  customer: { email: string };
  customData: Record<string, string>;
  settings: {
    displayMode: string;
    theme: string;
    variant?: "one-page" | "multi-page";
    frameTarget?: string;
    frameInitialHeight?: string;
    frameStyle?: string;
    successUrl?: string;
    allowLogout?: boolean;
    showAddTaxId?: boolean;
  };
}

interface PaddleGlobal {
  Environment: { set: (env: "sandbox" | "production") => void };
  Initialize: (opts: {
    token: string;
    eventCallback?: (event: { name?: string; data?: { transaction_id?: string } }) => void;
  }) => void;
  Checkout: { open: (opts: PaddleCheckoutOptions) => void };
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let loadPromise: Promise<PaddleGlobal> | null = null;
let initialized = false;
let checkoutCompletedHandler: ((transactionId?: string) => void) | null = null;

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

export async function startCheckout(
  planId: "analyze" | "broker",
  frameTarget: string,
  onCompleted: (transactionId?: string) => void
): Promise<void> {
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
  if (!initialized) {
    Paddle.Initialize({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        if (event.name === "checkout.completed") {
          checkoutCompletedHandler?.(event.data?.transaction_id);
        }
      },
    });
    initialized = true;
  }
  checkoutCompletedHandler = onCompleted;
  Paddle.Checkout.open({
    items: [{ priceId: data.priceId, quantity: 1 }],
    customer: data.customer,
    customData: data.customData,
    settings: {
      displayMode: "inline",
      theme: "dark",
      variant: "one-page",
      frameTarget,
      frameInitialHeight: "620",
      frameStyle: "width:100%; min-width:312px; background-color:transparent; border:0;",
      allowLogout: false,
    },
  });
}
