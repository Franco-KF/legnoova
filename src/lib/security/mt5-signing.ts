import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { SECURITY } from "@/lib/security/config";
import { getRedis } from "@/lib/redis";

/**
 * MT5 bridge request signing (v2).
 *
 * Every bridge request to the cloud includes:
 *   X-MT5-Timestamp: unix seconds
 *   X-MT5-Nonce: random hex/base64url (single use)
 *   X-MT5-Signature: hex HMAC-SHA256 over the canonical request
 *
 * Canonical request (newline separated):
 *   v2
 *   METHOD
 *   /request/path
 *   timestamp
 *   nonce
 *   sha256(raw body)
 *
 * The HMAC key is the raw 32-byte SHA-256 digest of the device token. The
 * server only stores the hex digest, so both sides can derive the same key.
 * Binding the method, path, and body hash prevents a signed request from being
 * replayed against a different endpoint.
 */

const SIGNATURE_VERSION = "v2";
const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const SIGNATURE_PATTERN = /^[a-f0-9]{64}$/i;
const CLOCK_SKEW_SECONDS = 30;

const NONCE_CACHE = new Map<string, number>();
let lastNonceCleanup = Date.now();
const NONCE_CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupNonces(now: number) {
  if (now - lastNonceCleanup < NONCE_CLEANUP_INTERVAL) return;
  lastNonceCleanup = now;
  for (const [key, expiresAt] of NONCE_CACHE) {
    if (expiresAt <= now) NONCE_CACHE.delete(key);
  }
}

/**
 * Derive the HMAC key from either a raw device token or its SHA-256 hex digest.
 * Device tokens use the `lvea_` prefix, so a 64-character hex string is always
 * treated as an already-hashed token.
 */
export function mt5SigningKey(tokenOrHash: string): Buffer {
  if (SIGNATURE_PATTERN.test(tokenOrHash)) {
    return Buffer.from(tokenOrHash, "hex");
  }
  return createHash("sha256").update(tokenOrHash, "utf8").digest();
}

export function mt5BodyDigest(body: string | null): string {
  return createHash("sha256").update(body ?? "", "utf8").digest("hex");
}

export function mt5CanonicalRequest(
  method: string,
  path: string,
  timestampSec: number,
  nonce: string,
  body: string | null
): string {
  return [
    SIGNATURE_VERSION,
    method.toUpperCase(),
    path,
    String(timestampSec),
    nonce,
    mt5BodyDigest(body),
  ].join("\n");
}

export function signMt5Request(
  tokenOrHash: string,
  method: string,
  path: string,
  timestampSec: number,
  nonce: string,
  body: string | null
): string {
  const canonical = mt5CanonicalRequest(
    method,
    path,
    timestampSec,
    nonce,
    body
  );
  return createHmac("sha256", mt5SigningKey(tokenOrHash))
    .update(canonical, "utf8")
    .digest("hex");
}

export interface Mt5VerifyResult {
  ok: boolean;
  reason?: string;
}

/**
 * Record a nonce once. Uses Redis SET NX when available so replay protection
 * works across serverless instances; otherwise falls back to process memory.
 */
export async function recordNonce(
  tokenHash: string,
  nonce: string,
  ttlSeconds: number
): Promise<boolean> {
  const key = `mt5:nonce:${tokenHash}:${nonce}`;
  const redis = await getRedis();
  if (redis) {
    try {
      const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
      return result === "OK";
    } catch {
      /* fall through to memory */
    }
  }

  const now = Date.now();
  cleanupNonces(now);
  if (NONCE_CACHE.has(key)) return false;
  NONCE_CACHE.set(key, now + ttlSeconds * 1000);
  return true;
}

/**
 * Verify an MT5 signed request. Returns { ok, reason } and throws nothing.
 */
export async function verifyMt5Signature(
  tokenOrHash: string,
  method: string,
  path: string,
  timestampSec: number,
  nonce: string,
  body: string | null,
  providedSignature: string
): Promise<Mt5VerifyResult> {
  if (!Number.isSafeInteger(timestampSec) || timestampSec <= 0) {
    return { ok: false, reason: "mt5_timestamp_invalid" };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    timestampSec < nowSec - SECURITY.MT5_NONCE_TOLERANCE_SECONDS ||
    timestampSec > nowSec + CLOCK_SKEW_SECONDS
  ) {
    return { ok: false, reason: "mt5_timestamp_stale" };
  }

  if (!NONCE_PATTERN.test(nonce)) {
    return { ok: false, reason: "mt5_nonce_invalid" };
  }
  if (!SIGNATURE_PATTERN.test(providedSignature)) {
    return { ok: false, reason: "mt5_signature_invalid" };
  }

  const expected = signMt5Request(
    tokenOrHash,
    method,
    path,
    timestampSec,
    nonce,
    body
  );
  const expectedBytes = Buffer.from(expected, "hex");
  const providedBytes = Buffer.from(providedSignature, "hex");
  if (
    expectedBytes.length !== providedBytes.length ||
    !timingSafeEqual(expectedBytes, providedBytes)
  ) {
    return { ok: false, reason: "mt5_signature_invalid" };
  }

  if (
    !(await recordNonce(
      mt5BodyDigest(tokenOrHash).slice(0, 32),
      nonce,
      SECURITY.MT5_NONCE_TOLERANCE_SECONDS
    ))
  ) {
    return { ok: false, reason: "mt5_nonce_replayed" };
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
