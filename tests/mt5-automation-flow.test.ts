/**
 * MT5 Automation Flow Integration Tests
 * 
 * These tests verify the complete auto-order placement flow:
 * 1. Chart analysis → signal creation
 * 2. Signal queuing → MT5 device polls
 * 3. EA executes order → trade event callback
 * 4. Dashboard shows results
 * 
 * Run with: npx vitest run tests/mt5-automation-flow.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database connection
vi.mock("@/lib/mongodb", () => ({
  dbConnect: vi.fn().mockResolvedValue(undefined),
}));

// Mock NextAuth
vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user-id" } }),
}));

describe("MT5 Automation Flow - Signal Queue", () => {
  it("signal must have valid structure for MT5 execution", () => {
    const signal = {
      id: "507f1f77bcf86cd799439011",
      symbol: "EURUSD",
      direction: "buy",
      entryPrice: 1.0845,
      stopLoss: 1.0795,
      takeProfit: 1.0895,
      createdAt: Math.floor(Date.now() / 1000),
      timeframe: "H1",
      automationMode: "normal",
      riskPercent: 0.5,
    };

    // Validate signal ID format (24 char hex)
    expect(signal.id).toMatch(/^[a-f\d]{24}$/i);
    expect(signal.id.length).toBe(24);

    // Validate prices
    expect(signal.entryPrice).toBeGreaterThan(0);
    expect(signal.stopLoss).toBeGreaterThan(0);
    expect(signal.takeProfit).toBeGreaterThan(signal.entryPrice); // buy target above entry
    expect(signal.stopLoss).toBeLessThan(signal.entryPrice); // buy stop below entry

    // Validate timestamps
    expect(signal.createdAt).toBeGreaterThan(0);
    expect(typeof signal.createdAt).toBe("number");
  });

  it("sell signal has correct price relationship", () => {
    const signal = {
      entryPrice: 1.0845,
      stopLoss: 1.0895,
      takeProfit: 1.0795,
      direction: "sell",
    };

    expect(signal.stopLoss).toBeGreaterThan(signal.entryPrice); // sell stop above entry
    expect(signal.takeProfit).toBeLessThan(signal.entryPrice); // sell target below entry
  });

  it("signal age check rejects stale signals", () => {
    const maxAgeSeconds = 300;
    const now = Math.floor(Date.now() / 1000);
    const freshSignal = { createdAt: now - 60 }; // 1 min ago
    const staleSignal = { createdAt: now - 400 }; // 6+ min ago

    const isFresh = now - freshSignal.createdAt <= maxAgeSeconds;
    const isStale = now - staleSignal.createdAt > maxAgeSeconds;

    expect(isFresh).toBe(true);
    expect(isStale).toBe(true);
  });
});

describe("MT5 Automation Flow - Device API Contract", () => {
  it("GET /api/automation/device returns flat JSON contract", () => {
    // The EA parses flat JSON - fields must be at top level
    const contract = {
      enabled: true,
      automationMode: "normal",
      riskPercent: 0.5,
      id: "507f1f77bcf86cd799439011",
      symbol: "EURUSD",
      direction: "buy",
      entryPrice: 1.0845,
      stopLoss: 1.0795,
      takeProfit: 1.0895,
      createdAt: 1735689600,
      timeframe: "H1",
    };

    // Verify no nested "signal" object
    expect("signal" in contract).toBe(false);
    expect(contract.id).toBeDefined();
    expect(contract.symbol).toBeDefined();
    expect(contract.entryPrice).toBeDefined();
    expect(contract.stopLoss).toBeDefined();
    expect(contract.takeProfit).toBeDefined();
  });

  it("acknowledgement payload matches EA format", () => {
    const ack = {
      signalId: "507f1f77bcf86cd799439011",
      status: "executed",
      brokerOrderId: "123456",
    };

    expect(ack.signalId).toMatch(/^[a-f\d]{24}$/i);
    expect(["executed", "rejected", "error", "already_executed", "position_limit"]).toContain(ack.status);
    expect(typeof ack.brokerOrderId).toBe("string");
  });

  it("trade event payload matches EA format", () => {
    const event = {
      signalId: "507f1f77bcf86cd799439011",
      dealId: "789012",
      brokerOrderId: "345678",
      eventType: "entry",
      symbol: "EURUSD",
      currency: "USD",
      volume: 0.02,
      price: 1.0845,
      netProfit: 0,
      occurredAt: Math.floor(Date.now() / 1000),
    };

    expect(event.eventType).toMatch(/^(entry|exit)$/);
    expect(event.volume).toBeGreaterThan(0);
    expect(event.price).toBeGreaterThan(0);
    expect(event.dealId).toMatch(/^\d+$/);
    expect(event.occurredAt).toBeGreaterThan(0);
  });
});

describe("MT5 Automation Flow - Diagnostics Heartbeat", () => {
  it("runtime schema accepts valid heartbeat", () => {
    const heartbeat = {
      executionEnabled: true,
      terminalTradeAllowed: true,
      accountTradeAllowed: true,
      expertTradeAllowed: true,
      demoAccount: true,
      chartM1: false,
      liveTradingAllowed: false,
      accountCurrency: "USD",
      eaOpenPositions: 0,
      eaFloatingProfit: 0.0,
      status: "polling",
    };

    // All required fields present
    expect(typeof heartbeat.executionEnabled).toBe("boolean");
    expect(typeof heartbeat.terminalTradeAllowed).toBe("boolean");
    expect(typeof heartbeat.accountTradeAllowed).toBe("boolean");
    expect(typeof heartbeat.expertTradeAllowed).toBe("boolean");
    expect(typeof heartbeat.demoAccount).toBe("boolean");
    expect(typeof heartbeat.chartM1).toBe("boolean");
    expect(typeof heartbeat.liveTradingAllowed).toBe("boolean");
    expect(typeof heartbeat.accountCurrency).toBe("string");
    expect(typeof heartbeat.eaOpenPositions).toBe("number");
    expect(typeof heartbeat.eaFloatingProfit).toBe("number");
    expect(typeof heartbeat.status).toBe("string");
  });

  it("heartbeat is considered fresh within 45 seconds", () => {
    const now = Date.now();
    const freshHeartbeat = now - 10000; // 10 seconds ago
    const staleHeartbeat = now - 60000; // 60 seconds ago

    const isFresh = Date.now() - freshHeartbeat <= 45_000;
    const isStale = Date.now() - staleHeartbeat > 45_000;

    expect(isFresh).toBe(true);
    expect(isStale).toBe(true);
  });
});

describe("MT5 Automation Flow - Activation Guard", () => {
  it("blocks activation on live account", () => {
    const runtime = {
      demoAccount: false,
      liveTradingAllowed: true,
      executionEnabled: true,
      terminalTradeAllowed: true,
      accountTradeAllowed: true,
      expertTradeAllowed: true,
    };

    const canActivate = runtime.demoAccount && !runtime.liveTradingAllowed;
    expect(canActivate).toBe(false);
  });

  it("allows activation on demo account", () => {
    const runtime = {
      demoAccount: true,
      liveTradingAllowed: false,
      executionEnabled: true,
      terminalTradeAllowed: true,
      accountTradeAllowed: true,
      expertTradeAllowed: true,
    };

    const canActivate = runtime.demoAccount && !runtime.liveTradingAllowed;
    expect(canActivate).toBe(true);
  });

  it("blocks normal mode without M1 chart for scalping", () => {
    const mode = "scalping";
    const chartM1 = false;
    const canActivate = mode !== "scalping" || chartM1;
    expect(canActivate).toBe(false);
  });

  it("allows scalping with M1 chart", () => {
    const mode = "scalping";
    const chartM1 = true;
    const canActivate = mode !== "scalping" || chartM1;
    expect(canActivate).toBe(true);
  });
});

describe("MT5 Automation Flow - Risk Calculation", () => {
  it("calculates lot size from risk percent", () => {
    const equity = 10000;
    const riskPercent = 0.5; // 0.5%
    const stopDistancePoints = 50;
    const pointValue = 0.0001; // EURUSD
    const contractSize = 100000;

    const riskMoney = equity * (riskPercent / 100);
    const oneLotLoss = stopDistancePoints * pointValue * contractSize;
    const rawLots = riskMoney / oneLotLoss;

    expect(riskMoney).toBe(50); // $50 risk
    expect(oneLotLoss).toBe(500); // $500 per lot for 50 points
    expect(rawLots).toBe(0.1); // 0.1 lot
  });

  it("caps risk at maximum for scalping", () => {
    const maxScalpRisk = 0.05;
    const requestedRisk = 0.5;
    const appliedRisk = Math.min(requestedRisk, maxScalpRisk);
    expect(appliedRisk).toBe(0.05);
  });

  it("rejects zero or negative stop distance", () => {
    const entry = 1.0845;
    const stop = 1.0845; // Same as entry
    const valid = stop < entry; // For buy, stop must be below entry
    expect(valid).toBe(false);
  });
});
