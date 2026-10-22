import { describe, it, expect } from "vitest";
import { cacheKey } from "@/lib/cache/ttl-cache";

describe("cacheKey", () => {
  it("creates consistent keys", () => {
    const k1 = cacheKey("analyze", "img-hash", "scalping-confluence", "M1", "EURUSD");
    const k2 = cacheKey("analyze", "img-hash", "scalping-confluence", "M1", "EURUSD");
    expect(k1).toBe(k2);
  });

  it("creates different keys for different inputs", () => {
    const k1 = cacheKey("analyze", "hash1", "scalping-confluence", "M1");
    const k2 = cacheKey("analyze", "hash2", "scalping-confluence", "M1");
    expect(k1).not.toBe(k2);
  });
});
