import { NextResponse } from "next/server";

interface CacheEntry {
  data: string;
  expiresAt: number;
  headers: Record<string, string>;
}

const cache = new Map<string, CacheEntry>();

export function getCachedResponse(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setCachedResponse(key: string, data: unknown, ttlMs: number, extraHeaders?: Record<string, string>): void {
  cache.set(key, {
    data: typeof data === "string" ? data : JSON.stringify(data),
    expiresAt: Date.now() + ttlMs,
    headers: { "content-type": "application/json", ...(extraHeaders || {}) },
  });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export function cachedJson(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<unknown>,
  extraHeaders?: Record<string, string>
) {
  return async (): Promise<NextResponse> => {
    const cached = getCachedResponse(key);
    if (cached) {
      return new NextResponse(cached.data, { status: 200, headers: { ...cached.headers, "x-cache": "HIT" } });
    }
    try {
      const data = await fetchFn();
      const body = typeof data === "string" ? data : JSON.stringify(data);
      setCachedResponse(key, data, ttlMs, extraHeaders);
      return new NextResponse(body, { status: 200, headers: { "content-type": "application/json", "x-cache": "MISS", ...(extraHeaders || {}) } });
    } catch {
      return new NextResponse(JSON.stringify({ error: "Upstream error" }), { status: 502, headers: { "content-type": "application/json" } });
    }
  };
}
