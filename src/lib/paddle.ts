import crypto from "node:crypto";

/**
 * Paddle Billing helpers.
 *
 * Env vars (see .env.example):
 *  - PADDLE_API_KEY             — server-side Paddle API key (secret)
 *  - PADDLE_WEBHOOK_SECRET      — webhook signing secret (secret)
 *  - NEXT_PUBLIC_PADDLE_CLIENT_TOKEN  — Paddle.js client-side token (public)
 *  - NEXT_PUBLIC_PADDLE_ENV     — "sandbox" | "production"
 *  - NEXT_PUBLIC_PADDLE_PRICE_ANALYZE — price id (pri_...) for the $29 plan
 *  - NEXT_PUBLIC_PADDLE_PRICE_BROKER  — price id (pri_...) for the $59 plan
 */

export const PADDLE_API_BASE =
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

export function isPaddleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.PADDLE_API_KEY &&
      process.env.PADDLE_WEBHOOK_SECRET
  );
}

/**
 * Verify a Paddle webhook signature (Paddle-Signature header).
 *
 * Format: `ts=<unix_ts>;h1=<hmac_sha256(ts + ":" + rawBody, secret)>`
 * Rejects signatures older than MAX_AGE_SECONDS to block replay attacks.
 */
const MAX_AGE_SECONDS = 60 * 10;

export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;

  let ts: string | undefined;
  let h1: string | undefined;
  for (const part of signatureHeader.split(";")) {
    const [key, value] = part.split("=");
    if (key === "ts") ts = value;
    if (key === "h1") h1 = value;
  }
  if (!ts || !h1) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(ts));
  if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(h1, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Call the Paddle API with the server key. Throws on non-2xx. */
export async function paddleApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Paddle API ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}
