import mongoose from "mongoose";
import { Analysis } from "@/models/Analysis";
import { EAcknowledgement } from "@/models/EAcknowledgement";
import { User, type IUser } from "@/models/User";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";

export async function getAutomationDiagnostics(user: IUser) {
  const hasBrokerPlan = hasBrokerAutomationAccess(user);
  const tokenRecord = await User.findById(user._id).select("+eaTokenHash mt5LastSignalId mt5LeaseUntil");
  const after = tokenRecord?.mt5LastSignalId && mongoose.isValidObjectId(tokenRecord.mt5LastSignalId)
    ? new mongoose.Types.ObjectId(tokenRecord.mt5LastSignalId)
    : null;
  const queueFilter = {
    userId: user._id,
    published: true as const,
    automationEligible: true as const,
    signalStatus: "active" as const,
    direction: { $in: ["buy" as const, "sell" as const] },
    ...(after ? { _id: { $gt: after } } : {}),
  };
  const leaseActive = !!tokenRecord?.mt5LeaseUntil && tokenRecord.mt5LeaseUntil > new Date();

  const [queuedSignals, nextSignal, latestDirectionalSignal, latestAcknowledgement] = await Promise.all([
    Analysis.countDocuments(queueFilter),
    Analysis.findOne(queueFilter).sort({ _id: 1 }).select("symbol pair direction confidence strategy createdAt").lean(),
    Analysis.findOne({ userId: user._id, published: true, direction: { $in: ["buy", "sell"] } })
      .sort({ _id: -1 }).select("symbol pair direction confidence strategy automationEligible createdAt").lean(),
    EAcknowledgement.findOne({ userId: user._id }).sort({ createdAt: -1 }).select("status details brokerOrderId createdAt").lean(),
  ]);

  const tokenIssued = !!tokenRecord?.eaTokenHash;
  const enabled = !!user.brokerAutomationEnabled;
  const checks = [
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
      label: "Eligible signal waiting in queue",
      status: queuedSignals > 0 ? (leaseActive ? "waiting" : "pass") : "waiting",
      detail: queuedSignals > 0
        ? leaseActive
          ? `${queuedSignals} eligible signal${queuedSignals === 1 ? " is" : "s are"} queued${nextSignal ? ` (${nextSignal.symbol || nextSignal.pair} ${String(nextSignal.direction).toUpperCase()})` : ""}, but one is currently leased. The lease expires within 60 seconds if MT5 does not acknowledge it.`
          : `${queuedSignals} eligible signal${queuedSignals === 1 ? "" : "s"} are waiting for MT5${nextSignal ? ` (${nextSignal.symbol || nextSignal.pair} ${String(nextSignal.direction).toUpperCase()})` : ""}.`
        : latestDirectionalSignal && !latestDirectionalSignal.automationEligible
          ? `The latest directional analysis (${latestDirectionalSignal.symbol || latestDirectionalSignal.pair}, ${latestDirectionalSignal.strategy}) did not pass the automation filters. Use Trend-Pullback Confluence; the signal needs confidence ≥75, a visible 1.5R+ target, at least four confirmed checklist items, and aligned assessments.`
          : "No new signal currently meets the automation rules. Use Trend-Pullback Confluence and wait for a qualifying chart setup. Signals created before your device token was issued are intentionally skipped.",
    },
    {
      id: "last-ea-result",
      label: "Most recent EA result",
      status: latestAcknowledgement ? "info" : "waiting",
      detail: latestAcknowledgement
        ? `${latestAcknowledgement.status}${latestAcknowledgement.details ? ` — ${latestAcknowledgement.details}` : ""}${latestAcknowledgement.createdAt ? ` (${new Date(latestAcknowledgement.createdAt).toISOString()})` : ""}`
        : "No MT5 execution result has been reported yet. The local check below will verify whether the EA is polling.",
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
      createdAt: latestDirectionalSignal.createdAt,
    } : null,
    leaseActive,
    brokerAccess: hasBrokerPlan,
    tokenIssued,
    enabled,
    readyForNewSignals: hasBrokerPlan && tokenIssued && enabled,
  };
}
