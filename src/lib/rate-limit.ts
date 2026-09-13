import { NextResponse } from "next/server";

/**
 * Simple in-memory fixed-window rate limiter.
 *
 * Good enough for a single-region deployment (e.g. one Vercel instance /
 * self-hosted node). For multi-instance deployments, back this with Redis
 * or Upstash before scaling horizontally.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Periodically evict expired buckets so the map does not grow unbounded.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitOptions {
  /** Identifier for the limiter scope, e.g. "register" or "analyze". */
  key: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec?: number;
}

export function rateLimit(
  req: Request,
  { key, limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucketKey = `${key}:${getClientIp(req)}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true };
}

/** Convenience helper: returns a 429 response when the limit is exceeded. */
export function rateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.ok) return null;
  const res = NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429 }
  );
  res.headers.set(
    "Retry-After",
    String(result.retryAfterSec ?? 60)
  );
  return res;
}
