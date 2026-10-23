import { createHmac, timingSafeEqual } from "node:crypto";
import { SECURITY } from "@/lib/security/config";

/**
 * MT5 bridge request signing.
 *
 * Every MT5 bridge request to the cloud must include:
 *   X-MT5-Timestamp: unix seconds
 *   X-MT5-Nonce: random base64
 *   X-MT5-Signature: hex HMAC-SHA256(deviceTokenSecret, timestamp + nonce + body)
 *
 * The server verifies:
 *   1. Timestamp within tolerance (replay window)
 *   2. Nonce not seen before within window (replay cache)
 *   3. HMAC signature matches (integrity + authenticity)
 *
 * This binds each request to a short time window and a single-use nonce,
 * making captured requests unreplayable and unsigned requests invalid.
 */

const NONCE_CACHE = new Map<string, { expiresAt: number }>();
let lastNonceCleanup = Date.now();
const NONCE_CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupNonces() {
  const now = Date.now();
  if (now - lastNonceCleanup < NONCE_CLEANUP_INTERVAL) return;
  lastNonceCleanup = now;
  for (const [key, entry] of NONCE_CACHE) {
    if (entry.expiresAt <= now) NONCE_CACHE.delete(key);
  }
}

export function recordNonce(nonce: string, ttlSeconds: number): boolean {
  cleanupNonces();
  if (NONCE_CACHE.has(nonce)) return false; // replayed
  NONCE_CACHE.set(nonce, { expiresAt: Date.now() + ttlSeconds * 1000 });
  return true;
}

/** Sign a payload with the device token secret (the raw token, not the hash). */
export function signMt5Request(
  deviceToken: string,
  timestampSec: number,
  nonce: string,
  body: string | null
): string {
  const message = `${timestampSec}.${nonce}.${body ?? ""}`;
  return createHmac("sha256", deviceToken).update(message).digest("hex");
}

/**
 * Verify an MT5 signed request.
 * Returns { ok, reason } and throws nothing.
 */
export interface Mt5VerifyResult {
  ok: boolean;
  reason?: string;
}

export function verifyMt5Signature(
  deviceToken: string,
  timestampSec: number,
  nonce: string,
  body: string | null,
  providedSignature: string
): Mt5VerifyResult {
  const nowSec = Math.floor(Date.now() / 1000);
  const age = nowSec - timestampSec;
  if (age < 0 || age > SECURITY.MT5_NONCE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "mt5_timestamp_stale" };
  }

  if (!recordNonce(nonce, SECURITY.MT5_NONCE_TOLERANCE_SECONDS)) {
    return { ok: false, reason: "mt5_nonce_replayed" };
  }

  const expected = signMt5Request(deviceToken, timestampSec, nonce, body);
  if (!timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expected))) {
    return { ok: false, reason: "mt5_signature_invalid" };
  }

  return { ok: true };
}

export function parseMt5Headers(headers: Headers): {
  timestampSec: number | null;
  nonce: string | null;
  signature: string | null;
} {
  const rawTs = headers.get("x-mt5-timestamp");
  const timestampSec = rawTs ? Number.parseInt(rawTs, 10) : null;
  const nonce = headers.get("x-mt5-nonce") ?? null;
  const signature = headers.get("x-mt5-signature") ?? null;
  return { timestampSec, nonce, signature };
}
