type CacheEntry<T> = { value: T; expiresAt: number };

export class TTLCache<T = unknown> {
  private map = new Map<string, CacheEntry<T>>();

  constructor(private readonly defaultTtlMs: number = 60_000) {}

  get(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.map.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    this.evictExpired();
    return this.map.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (now > entry.expiresAt) this.map.delete(key);
    }
  }
}

export const responseCache = new TTLCache<unknown>(30_000);

export function cacheKey(prefix: string, ...parts: unknown[]): string {
  return [prefix, ...parts.map((p) => String(p))].join(":");
}
