import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

/**
 * Rate limiter with optional Redis backend for multi-instance deployments.
 * Falls back to in-memory fixed-window when REDIS_URL is not set or Redis
 * cannot connect.
 */

type Bucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, Bucket>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}

/**
 * Resolve the client IP without blindly trusting the left-most
 * X-Forwarded-For value, which a client can spoof.
 */
export function getClientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  const cloudflare = req.headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    // The right-most entry is appended by the nearest trusted proxy.
    if (parts.length) return parts[parts.length - 1];
  }

  return "unknown";
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec?: number;
}

async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const redis = await getRedis();
  if (!redis) return null;
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
  try {
    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, Math.ceil(windowMs / 1000) + 1);
    }
    if (count > limit) {
      const ttl = await redis.ttl(windowKey);
      return { ok: false, retryAfterSec: Math.max(1, ttl) };
    }
    return { ok: true };
  } catch {
    return null;
  }
}

export function rateLimit(
  req: Request,
  { key, limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucketKey = `${key}:${getClientIp(req)}`;

  const bucket = memoryBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
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

/** Async Redis-aware rate limiter for serverless/Edge. */
export async function rateLimitAsync(
  req: Request,
  { key, limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  const redisResult = await redisRateLimit(
    `${key}:${getClientIp(req)}`,
    limit,
    windowMs
  );
  if (redisResult !== null) return redisResult;
  return rateLimit(req, { key, limit, windowMs });
}

export function rateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.ok) return null;
  const res = NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(result.retryAfterSec ?? 60));
  return res;
}

/**
 * Compression helper: sets content-encoding hints and Vary headers.
 * Next.js/Vercel handles gzip/brotli automatically at the edge; this is for
 * self-hosted Node deployments that need explicit headers.
 */
export function withCompressionHeaders(res: NextResponse): NextResponse {
  res.headers.set("Vary", "Accept-Encoding");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}
