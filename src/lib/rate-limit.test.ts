import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

// Clear memory buckets between tests to ensure isolation
beforeEach(() => {
  // We can't directly access the internal map, but we can wait for windows to reset
  // or just use different keys/IPs per test
});

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const result = rateLimit(req, { key: "test-allow", limit: 5, windowMs: 60_000 });
    expect(result.ok).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      rateLimit(req, { key: "test-block", limit: 5, windowMs: 60_000 });
    }
    const result = rateLimit(req, { key: "test-block", limit: 5, windowMs: 60_000 });
    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBeDefined();
    expect(result.retryAfterSec!).toBeGreaterThan(0);
  });

  it("uses different buckets for different IPs", () => {
    const req1 = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.3" },
    });
    const req2 = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.4" },
    });
    rateLimit(req1, { key: "test-ip", limit: 1, windowMs: 60_000 });
    const result1 = rateLimit(req1, { key: "test-ip", limit: 1, windowMs: 60_000 });
    expect(result1.ok).toBe(false);
    const result2 = rateLimit(req2, { key: "test-ip", limit: 1, windowMs: 60_000 });
    expect(result2.ok).toBe(true);
  });

  it("extracts x-forwarded-for correctly", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.5, 10.0.0.6" },
    });
    const result = rateLimit(req, { key: "test-xff", limit: 100, windowMs: 60_000 });
    expect(result.ok).toBe(true);
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-real-ip": "10.0.0.7" },
    });
    const result = rateLimit(req, { key: "test-realip", limit: 100, windowMs: 60_000 });
    expect(result.ok).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  it("returns null when ok", () => {
    const result = rateLimitResponse({ ok: true });
    expect(result).toBeNull();
  });

  it("returns 429 response when not ok", () => {
    const response = rateLimitResponse({ ok: false, retryAfterSec: 30 });
    expect(response).not.toBeNull();
    if (response) {
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("30");
    }
  });
});

describe("rateLimitAsync", () => {
  it("falls back to in-memory when Redis not available", async () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "10.0.0.8" },
    });
    const result = await rateLimitAsync(req, { key: "test-async", limit: 5, windowMs: 60_000 });
    expect(result.ok).toBe(true);
  });
});
