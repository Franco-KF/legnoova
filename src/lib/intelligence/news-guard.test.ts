import { describe, it, expect } from "vitest";
import { checkNewsGuard } from "@/lib/intelligence/news-guard";
import type { NewsGuardResult } from "@/lib/intelligence/news-guard";

describe("checkNewsGuard", () => {
  it("allows trading at midnight UTC (no news in 30-min window)", () => {
    // Midnight UTC - next high impact is at 8:30 (8.5 hours away)
    const midnight = new Date("2024-12-31T00:00:00Z").getTime();
    const result = checkNewsGuard("EURUSD", midnight);
    expect(result.tradable).toBe(true);
    expect(result.nearbyEvents.length).toBe(0);
  });

  it("blocks trading within 30 min before high-impact USD news", () => {
    // 8:00 UTC, 30 min before 8:30 high-impact USD event
    const beforeEvent = new Date("2024-12-31T08:00:00Z").getTime();
    const result = checkNewsGuard("USDCAD", beforeEvent);
    expect(result.tradable).toBe(false);
    expect(result.reason).toContain("High-impact");
  });

  it("blocks trading within 30 min after high-impact news", () => {
    // 8:40 UTC, 10 min after 8:30 high-impact USD event
    const afterEvent = new Date("2024-12-31T08:40:00Z").getTime();
    const result = checkNewsGuard("USDJPY", afterEvent);
    expect(result.tradable).toBe(false);
  });

  it("allows trading 2 hours after high-impact news", () => {
    // 10:30 UTC, 2 hours after 8:30 event
    const afterEvent = new Date("2024-12-31T10:30:00Z").getTime();
    const result = checkNewsGuard("EURUSD", afterEvent);
    expect(result.tradable).toBe(true);
  });

  it("treats USD news as affecting all pairs", () => {
    const beforeEvent = new Date("2024-12-31T08:00:00Z").getTime();
    const result = checkNewsGuard("EURJPY", beforeEvent);
    expect(result.tradable).toBe(false);
  });

  it("returns nearby events list when news is close", () => {
    const beforeEvent = new Date("2024-12-31T08:00:00Z").getTime();
    const result = checkNewsGuard("GBPUSD", beforeEvent);
    expect(Array.isArray(result.nearbyEvents)).toBe(true);
  });

  it("allows trading during low-impact news outside window", () => {
    // Medium impact has 10-min window, test outside it
    const result = checkNewsGuard("AUDUSD", new Date("2024-12-31T00:00:00Z").getTime());
    expect(result.tradable).toBe(true);
  });
});
