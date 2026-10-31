import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { Analysis } from "@/models/Analysis";
import { EAcknowledgement } from "@/models/EAcknowledgement";
import mongoose from "mongoose";
import {
  getClientIp,
  rateLimitAsync,
  rateLimitResponse,
} from "@/lib/rate-limit";
import {
  authorizeMt5Device,
  parseJsonBody,
  readBodyText,
} from "@/lib/mt5/device-auth";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const MT5_RATE_LIMIT = { limit: 120, windowMs: 60_000 };

export async function GET(req: Request) {
  try {
    const limited = rateLimitResponse(
      await rateLimitAsync(req, {
        key: "mt5-automation",
        limit: MT5_RATE_LIMIT.limit,
        windowMs: MT5_RATE_LIMIT.windowMs,
      })
    );
    if (limited) return limited;

    const body = await readBodyText(req);
    if (body.tooLarge) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    const auth = await authorizeMt5Device(req, {
      bodyText: body.text,
      endpoint: "signal-queue",
    });
    if (!auth.user) {
      return NextResponse.json(
        { error: "Unauthorized or Broker plan required", reason: auth.reason },
        { status: auth.status ?? 401 }
      );
    }
    const user = auth.user;

    const mode = user.brokerAutomationMode ?? "normal";
    const base = {
      automationMode: mode,
      riskPercent:
        mode === "scalping"
          ? Math.min(user.brokerRiskPercent ?? 0.05, 0.05)
          : user.brokerRiskPercent ?? 0.5,
    };
    if (!user.brokerAutomationEnabled) {
      return NextResponse.json({
        ...base,
        signal: null,
        enabled: false,
        status: "dashboard_disabled",
      });
    }

    const heartbeatFresh =
      !!user.mt5LastHeartbeatAt &&
      Date.now() - user.mt5LastHeartbeatAt.getTime() <= 45_000;
    const runtime = user.mt5Runtime;
    const runtimeReady =
      heartbeatFresh &&
      !!runtime?.executionEnabled &&
      !!runtime.terminalTradeAllowed &&
      !!runtime.accountTradeAllowed &&
      !!runtime.expertTradeAllowed &&
      !!runtime.demoAccount &&
      !runtime.liveTradingAllowed &&
      (mode !== "scalping" || !!runtime.chartM1);
    if (!runtimeReady) {
      return NextResponse.json({
        ...base,
        signal: null,
        enabled: true,
        status: "mt5_not_ready",
      });
    }
    if (user.mt5LeaseUntil && user.mt5LeaseUntil > new Date()) {
      return NextResponse.json({
        ...base,
        signal: null,
        enabled: true,
        status: "signal_leased",
        busy: true,
      });
    }

    const after =
      user.mt5LastSignalId && mongoose.isValidObjectId(user.mt5LastSignalId)
        ? new mongoose.Types.ObjectId(user.mt5LastSignalId)
        : null;
    const automationModeFilter =
      mode === "normal"
        ? {
            $or: [
              { automationMode: "normal" as const },
              { automationMode: { $exists: false } },
            ],
          }
        : { automationMode: "scalping" as const };
    const signal = await Analysis.findOne({
      userId: user._id,
      published: true,
      automationEligible: true,
      ...automationModeFilter,
      signalStatus: "active",
      direction: { $in: ["buy", "sell"] },
      ...(after ? { _id: { $gt: after } } : {}),
    })
      .sort({ _id: 1 })
      .lean();
    if (!signal) {
      return NextResponse.json({
        ...base,
        signal: null,
        enabled: true,
        status: "waiting_for_signal",
      });
    }

    const automationTarget = signal.takeProfits?.find(
      (target) => target.riskReward >= (mode === "scalping" ? 1.2 : 1.5)
    );
    if (!automationTarget) {
      return NextResponse.json({
        ...base,
        signal: null,
        enabled: true,
        status: "no_eligible_target",
      });
    }

    const leased = await User.findOneAndUpdate(
      {
        _id: user._id,
        mt5LastSignalId: user.mt5LastSignalId ?? null,
        $or: [{ mt5LeaseUntil: null }, { mt5LeaseUntil: { $lte: new Date() } }],
      },
      {
        $set: {
          mt5LeaseSignalId: signal._id.toString(),
          mt5LeaseUntil: new Date(Date.now() + 60_000),
        },
      },
      { new: true }
    );
    if (!leased) {
      return NextResponse.json({
        ...base,
        signal: null,
        enabled: true,
        status: "signal_leased",
        busy: true,
      });
    }

    return NextResponse.json(
      {
        ...base,
        enabled: true,
        id: signal._id.toString(),
        symbol: signal.symbol,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: automationTarget.price,
        createdAt: Math.floor(new Date(signal.createdAt).getTime() / 1000),
        timeframe: signal.timeframe,
        automationMode: mode,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(
      await rateLimitAsync(req, {
        key: "mt5-automation",
        limit: MT5_RATE_LIMIT.limit,
        windowMs: MT5_RATE_LIMIT.windowMs,
      })
    );
    if (limited) return limited;

    const body = await readBodyText(req);
    if (body.tooLarge) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    const auth = await authorizeMt5Device(req, {
      bodyText: body.text,
      endpoint: "signal-acknowledgement",
    });
    if (!auth.user) {
      return NextResponse.json(
        { error: "Unauthorized or Broker plan required", reason: auth.reason },
        { status: auth.status ?? 401 }
      );
    }
    const user = auth.user;

    const payload = parseJsonBody(body.text);
    if (
      !payload ||
      typeof payload !== "object" ||
      !("signalId" in payload) ||
      !("status" in payload) ||
      typeof payload.signalId !== "string" ||
      typeof payload.status !== "string" ||
      !/^[a-f\d]{24}$/i.test(payload.signalId) ||
      !/^[a-z_]{2,40}$/i.test(payload.status)
    ) {
      return NextResponse.json(
        { error: "Invalid acknowledgement" },
        { status: 400 }
      );
    }
    const acknowledgementBody = payload as {
      signalId: string;
      status: string;
      details?: unknown;
      brokerOrderId?: unknown;
    };

    const prior = await EAcknowledgement.findOne({
      userId: user._id,
      signalId: acknowledgementBody.signalId,
    });
    if (prior) {
      return NextResponse.json({
        acknowledged: true,
        status: prior.status,
      });
    }

    const mode = user.brokerAutomationMode ?? "normal";
    const automationModeFilter =
      mode === "normal"
        ? {
            $or: [
              { automationMode: "normal" as const },
              { automationMode: { $exists: false } },
            ],
          }
        : { automationMode: "scalping" as const };
    const signal = await Analysis.findOne({
      _id: acknowledgementBody.signalId,
      userId: user._id,
      published: true,
      automationEligible: true,
      ...automationModeFilter,
      signalStatus: "active",
      direction: { $in: ["buy", "sell"] },
    });
    if (!signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const after =
      user.mt5LastSignalId && mongoose.isValidObjectId(user.mt5LastSignalId)
        ? new mongoose.Types.ObjectId(user.mt5LastSignalId)
        : null;
    const nextSignal = await Analysis.findOne({
      userId: user._id,
      published: true,
      automationEligible: true,
      ...automationModeFilter,
      signalStatus: "active",
      direction: { $in: ["buy", "sell"] },
      ...(after ? { _id: { $gt: after } } : {}),
    })
      .sort({ _id: 1 })
      .select("_id")
      .lean();
    if (
      !nextSignal ||
      nextSignal._id.toString() !== acknowledgementBody.signalId
    ) {
      return NextResponse.json(
        { error: "Signal is not the next queued item" },
        { status: 409 }
      );
    }

    const acknowledgement = await EAcknowledgement.create({
      userId: user._id,
      signalId: signal._id,
      status: acknowledgementBody.status,
      details:
        typeof acknowledgementBody.details === "string"
          ? acknowledgementBody.details.slice(0, 500)
          : "",
      brokerOrderId:
        typeof acknowledgementBody.brokerOrderId === "string"
          ? acknowledgementBody.brokerOrderId.slice(0, 80)
          : "",
    });
    user.mt5LastSignalId = signal._id.toString();
    user.mt5LeaseSignalId = null;
    user.mt5LeaseUntil = null;
    await user.save();

    await recordSecurityEvent({
      type: "signal_executed",
      userId: user._id.toString(),
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? null,
      details: {
        signalId: signal._id.toString(),
        status: acknowledgementBody.status,
        symbol: signal.symbol,
        direction: signal.direction,
      },
      severity: "medium",
    });

    return NextResponse.json({
      acknowledged: true,
      status: acknowledgement.status,
    });
  } catch {
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}
