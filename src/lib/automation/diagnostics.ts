import mongoose from "mongoose";
import { Analysis } from "@/models/Analysis";
import { EAcknowledgement } from "@/models/EAcknowledgement";
import { User, type IUser } from "@/models/User";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";

export async function getAutomationDiagnostics(user: IUser) {
  const hasBrokerPlan = hasBrokerAutomationAccess(user);
  const mode = user.brokerAutomationMode ?? "normal";
  const automationModeFilter = mode === "normal"
    ? { $or: [{ automationMode: "normal" as const }, { automationMode: { $exists: false } }] }
    : { automationMode: "scalping" as const };
  const tokenRecord = await User.findById(user._id).select("+eaTokenHash mt5LastSignalId mt5LeaseUntil mt5LastHeartbeatAt mt5Runtime");
  const after = tokenRecord?.mt5LastSignalId && mongoose.isValidObjectId(tokenRecord.mt5LastSignalId)
    ? new mongoose.Types.ObjectId(tokenRecord.mt5LastSignalId)
    : null;
  const queueFilter = {
    userId: user._id,
    published: true as const,
    automationEligible: true as const,
    ...automationModeFilter,
    signalStatus: "active" as const,
    direction: { $in: ["buy" as const, "sell" as const] },
    ...(after ? { _id: { $gt: after } } : {}),
  };
  const leaseActive = !!tokenRecord?.mt5LeaseUntil && tokenRecord.mt5LeaseUntil > new Date();

  const [queuedSignals, nextSignal, latestDirectionalSignal, latestAcknowledgement] = await Promise.all([
    Analysis.countDocuments(queueFilter),
    Analysis.findOne(queueFilter).sort({ _id: 1 }).select("symbol pair direction confidence strategy createdAt").lean(),
    Analysis.findOne({ userId: user._id, published: true, direction: { $in: ["buy", "sell"] } })
      .sort({ _id: -1 }).select("symbol pair direction confidence strategy automationEligible automationMode createdAt").lean(),
    EAcknowledgement.findOne({ userId: user._id }).sort({ createdAt: -1 }).select("status details brokerOrderId createdAt").lean(),
  ]);

  const tokenIssued = !!tokenRecord?.eaTokenHash;
  const enabled = !!user.brokerAutomationEnabled;
  const heartbeatAgeSeconds = tokenRecord?.mt5LastHeartbeatAt
    ? Math.max(0, Math.floor((Date.now() - tokenRecord.mt5LastHeartbeatAt.getTime()) / 1000))
    : null;
  const heartbeatCurrent = heartbeatAgeSeconds !== null && heartbeatAgeSeconds <= 45;
  const runtime = tokenRecord?.mt5Runtime ?? null;
  const tradePermissions = !!runtime?.terminalTradeAllowed && !!runtime?.accountTradeAllowed && !!runtime?.expertTradeAllowed;
  const demoActivationReady = hasBrokerPlan && tokenIssued && heartbeatCurrent && !!runtime?.executionEnabled
    && tradePermissions && !!runtime?.demoAccount && !runtime?.liveTradingAllowed;
  const scalpingActivationReady = demoActivationReady && !!runtime?.chartM1;
  const activationBlockers = [
    !hasBrokerPlan ? "An active Broker plan is required." : null,
    !tokenIssued ? "Create a Legnoova bridge token." : null,
    !heartbeatCurrent ? "Wait for a current MT5/EA heartbeat." : null,
    heartbeatCurrent && !runtime?.executionEnabled ? "Set EA input ExecutionEnabled=true on demo." : null,
    heartbeatCurrent && !tradePermissions ? "Turn on MT5 Algo Trading and account/EA permissions." : null,
    heartbeatCurrent && !runtime?.demoAccount ? "Sign in to an MT5 demo account." : null,
    heartbeatCurrent && runtime?.liveTradingAllowed ? "Set AllowLiveAccount=false." : null,
  ].filter((blocker): blocker is string => !!blocker);
  const checks = [
    {
      id: "mt5-heartbeat",
      label: "Live MT5 terminal heartbeat",
      status: heartbeatCurrent ? "pass" : "fail",
      detail: heartbeatCurrent
        ? `MT5 reported its EA status ${heartbeatAgeSeconds}s ago: ${runtime?.status ?? "unknown"}.`
        : heartbeatAgeSeconds === null
          ? "No cloud heartbeat yet. Start the local bridge and attach the EA; the bridge reports the EA heartbeat to Legnoova."
          : `The last EA heartbeat was ${heartbeatAgeSeconds}s ago. Keep MT5 and bridge.py running; a connection older than 45s is treated as offline.`,
    },
    {
      id: "ea-execution-ready",
      label: "EA execution and trade permissions",
      status: runtime?.executionEnabled && tradePermissions ? "pass" : heartbeatCurrent ? "fail" : "waiting",
      detail: !heartbeatCurrent
        ? "Waiting for a current terminal heartbeat."
        : runtime?.executionEnabled && tradePermissions
          ? "EA execution switch and MT5 terminal, account, and Algo Trading permissions are on."
          : `Check ExecutionEnabled and MT5 trade permissions. Last EA status: ${runtime?.status ?? "unknown"}.`,
    },
    {
      id: "demo-account",
      label: "Demo-account safety",
      status: !heartbeatCurrent ? "waiting" : runtime?.demoAccount && !runtime.liveTradingAllowed ? "pass" : "fail",
      detail: !heartbeatCurrent
        ? "Waiting for a current terminal heartbeat."
        : runtime?.demoAccount && !runtime.liveTradingAllowed
          ? "EA is connected to a demo account and live-account execution is blocked."
          : "Activation is blocked: sign in to an MT5 demo account and keep AllowLiveAccount=false.",
    },
    {
      id: "automation-mode",
      label: "Selected automation mode",
      status: "info",
      detail: mode === "scalping"
        ? "M1 Scalping (Demo) is selected. The EA uses closed-candle price rules without requiring chart uploads; eligible manual M1 analyses can also be queued. Demo-only and risk/rate limits are enforced in the EA."
        : "Normal automation is selected. Use Trend-Pullback Confluence for queue-eligible signals.",
    },
    {
      id: "broker-plan",
      label: "Broker plan access",
      status: hasBrokerPlan ? "pass" : "fail",
      detail: hasBrokerPlan ? "Your Broker plan is active." : "An active Broker plan is required for MT5 automation.",
    },
    {
      id: "device-token",
      label: "Legnoova device token",
      status: tokenIssued ? "pass" : "fail",
      detail: tokenIssued ? "A device token is registered. The secret itself is never shown here." : "Create a bridge token in this page, then configure it in the Python bridge.",
    },
    {
      id: "automation-enabled",
      label: "Dashboard automation switch",
      status: enabled ? "pass" : "fail",
      detail: enabled ? "Automation is enabled on Legnoova." : "Automation is paused on Legnoova. Enable it after checking the EA and broker account settings.",
    },
    {
      id: "eligible-signal",
      label: mode === "scalping" ? "Autonomous M1 rule engine" : "Eligible signal waiting in queue",
      status: mode === "scalping"
        ? enabled && scalpingActivationReady ? "pass" : "waiting"
        : queuedSignals > 0 ? (!enabled || leaseActive ? "waiting" : "pass") : "waiting",
      detail: mode === "scalping"
        ? !enabled
          ? "Scalping is not activated. The dashboard must be armed after a fresh M1 demo heartbeat."
          : !scalpingActivationReady
            ? "The autonomous rule engine is blocked until the demo account, M1 chart, EA execution switch, and trade permissions are ready."
            : `The EA evaluates each newly closed M1 candle: body at least 65% of its range and close in the outer 20% determines direction; ATR(14) sets the stop and 1.2R target. Current EA status: ${runtime?.status ?? "unknown"}. ${queuedSignals ? `${queuedSignals} separately analyzed signal(s) also queued.` : "No screenshot is required for rule-generated entries."}`
        : queuedSignals > 0
          ? !enabled
            ? `${queuedSignals} eligible normal-automation signal${queuedSignals === 1 ? " is" : "s are"} waiting, but the dashboard switch is paused.`
            : leaseActive
            ? `${queuedSignals} eligible signal${queuedSignals === 1 ? " is" : "s are"} queued${nextSignal ? ` (${nextSignal.symbol || nextSignal.pair} ${String(nextSignal.direction).toUpperCase()})` : ""}, but one is currently leased. The lease expires within 60 seconds if MT5 does not acknowledge it.`
            : `${queuedSignals} eligible normal-automation signal${queuedSignals === 1 ? "" : "s"} are waiting for MT5${nextSignal ? ` (${nextSignal.symbol || nextSignal.pair} ${String(nextSignal.direction).toUpperCase()})` : ""}.`
          : latestDirectionalSignal && (!latestDirectionalSignal.automationEligible || (latestDirectionalSignal.automationMode ?? "normal") !== mode)
            ? `The latest directional analysis (${latestDirectionalSignal.symbol || latestDirectionalSignal.pair}, ${latestDirectionalSignal.strategy}) did not pass the automation filters. Use Trend-Pullback Confluence; the signal needs confidence ≥75, a visible 1.5R+ target, at least four confirmed checklist items, and aligned assessments.`
            : "No new normal-automation signal currently meets the filters. Use Trend-Pullback Confluence and wait for a qualifying chart setup. Signals created before your device token was issued or before the mode changed are skipped.",
    },
    {
      id: "last-ea-result",
      label: "Most recent EA result",
      status: latestAcknowledgement || heartbeatCurrent ? "info" : "waiting",
      detail: latestAcknowledgement
        ? `${latestAcknowledgement.status}${latestAcknowledgement.details ? ` — ${latestAcknowledgement.details}` : ""}${latestAcknowledgement.createdAt ? ` (${new Date(latestAcknowledgement.createdAt).toISOString()})` : ""}`
        : heartbeatCurrent
          ? `The EA reports “${runtime?.status ?? "unknown"}”. Open/closed fills and their net P/L appear in Trade activity when MT5 confirms a deal.`
          : "No recent MT5 heartbeat or signal result has been reported. Start the bridge and attach the EA.",
    },
  ];

  return {
    checks,
    queuedSignals,
    nextSignal: nextSignal ? {
      symbol: nextSignal.symbol || nextSignal.pair,
      direction: nextSignal.direction,
      confidence: nextSignal.confidence,
      strategy: nextSignal.strategy,
      createdAt: nextSignal.createdAt,
    } : null,
    latestDirectionalSignal: latestDirectionalSignal ? {
      symbol: latestDirectionalSignal.symbol || latestDirectionalSignal.pair,
      direction: latestDirectionalSignal.direction,
      confidence: latestDirectionalSignal.confidence,
      strategy: latestDirectionalSignal.strategy,
      automationEligible: !!latestDirectionalSignal.automationEligible,
      automationMode: latestDirectionalSignal.automationMode ?? "normal",
      createdAt: latestDirectionalSignal.createdAt,
    } : null,
    leaseActive,
    brokerAccess: hasBrokerPlan,
    tokenIssued,
    enabled,
    mode,
    mt5: {
      connected: heartbeatCurrent,
      lastSeenSecondsAgo: heartbeatAgeSeconds,
      runtime,
    },
    activation: {
      demoReady: demoActivationReady,
      scalpingReady: scalpingActivationReady,
      blockers: activationBlockers,
      scalpingBlockers: [
        ...activationBlockers,
        heartbeatCurrent && runtime?.demoAccount && !runtime.chartM1 ? "Attach the EA to an M1 chart." : null,
      ].filter((blocker): blocker is string => !!blocker),
    },
    readyForNewSignals: (mode === "scalping" ? scalpingActivationReady : demoActivationReady) && enabled,
  };
}
