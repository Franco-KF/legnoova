import { describe, it, expect, vi } from "vitest";
import { withRetry, isRetryable } from "@/lib/resilience/retry";

describe("isRetryable", () => {
  it("returns true for network errors", () => {
    expect(isRetryable(new Error("ECONNREFUSED"), { retryableErrors: /ECONNREFUSED/ })).toBe(true);
    expect(isRetryable(new Error("ENOTFOUND"), { retryableErrors: /ENOTFOUND/ })).toBe(true);
    expect(isRetryable(new Error("fetch failed"), { retryableErrors: /fetch failed/ })).toBe(true);
  });

  it("returns true for 5xx HTTP errors", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = new Error("server error") as any;
    err.status = 502;
    expect(isRetryable(err, {})).toBe(true);
    err.status = 503;
    expect(isRetryable(err, {})).toBe(true);
    err.status = 504;
    expect(isRetryable(err, {})).toBe(true);
  });

  it("returns false for 4xx errors", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = new Error("not found") as any;
    err.status = 404;
    expect(isRetryable(err, {})).toBe(false);
    err.status = 401;
    expect(isRetryable(err, {})).toBe(false);
  });

  it("returns false for non-Error", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isRetryable("string error" as any, {})).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isRetryable(null as any, {})).toBe(false);
  });
});

describe("withRetry", () => {
  it("succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable error and eventually succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after max attempts exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 1 })).rejects.toThrow("ECONNREFUSED");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("permanent failure"));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow("permanent failure");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry callback", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValue("ok");
    await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
