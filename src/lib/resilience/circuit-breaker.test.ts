import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircuitBreaker, getOrCreateBreaker, getBreakerState } from "@/lib/resilience/circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeoutMs: 1000,
      halfOpenMaxCalls: 2,
    });
  });

  it("starts in closed state and allows calls", () => {
    expect(breaker.getState()).toBe("closed");
    expect(breaker.isAvailable()).toBe(true);
  });

  it("opens after reaching failure threshold", async () => {
    const failingFn = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow("fail");
    }
    expect(breaker.getState()).toBe("open");
    expect(breaker.isAvailable()).toBe(false);
  });

  it("transitions to half-open after recovery timeout", async () => {
    const failingFn = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow("fail");
    }
    expect(breaker.getState()).toBe("open");
    await new Promise((r) => setTimeout(r, 1100));
    // isAvailable() triggers the open -> half-open transition
    expect(breaker.isAvailable()).toBe(true);
    expect(breaker.getState()).toBe("half-open");
  });

  it("closes after successful half-open call", async () => {
    const failingFn = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow("fail");
    }
    await new Promise((r) => setTimeout(r, 1100));
    await breaker.execute(() => Promise.resolve("success"));
    expect(breaker.getState()).toBe("closed");
  });

  it("resets state", async () => {
    const failingFn = () => Promise.reject(new Error("fail"));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow("fail");
    }
    breaker.reset();
    expect(breaker.getState()).toBe("closed");
    expect(breaker.isAvailable()).toBe(true);
  });
});

describe("getOrCreateBreaker", () => {
  it("returns the same breaker for the same name", () => {
    const b1 = getOrCreateBreaker("test-breaker", {
      failureThreshold: 3,
      recoveryTimeoutMs: 1000,
      halfOpenMaxCalls: 2,
    });
    const b2 = getOrCreateBreaker("test-breaker", {
      failureThreshold: 5,
      recoveryTimeoutMs: 5000,
      halfOpenMaxCalls: 10,
    });
    expect(b1).toBe(b2);
  });

  it("getBreakerState returns null for unknown breaker", () => {
    expect(getBreakerState("nonexistent")).toBeNull();
  });
});
