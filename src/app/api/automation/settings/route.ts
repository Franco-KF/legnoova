import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Analysis } from "@/models/Analysis";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";

const schema = z.object({
  enabled: z.boolean(),
  riskPercent: z.number().min(0.05).max(0.5),
  mode: z.enum(["normal", "scalping"]).optional(),
});

async function getUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await dbConnect();
  return User.findById(session.user.id);
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tokenRecord = await User.findById(user._id).select("+eaTokenHash");
  return NextResponse.json({
    hasBrokerPlan: hasBrokerAutomationAccess(user),
    enabled: !!user.brokerAutomationEnabled,
    mode: user.brokerAutomationMode ?? "normal",
    riskPercent: (user.brokerAutomationMode ?? "normal") === "scalping"
      ? Math.min(user.brokerRiskPercent ?? 0.05, 0.05)
      : user.brokerRiskPercent ?? 0.5,
    tokenIssued: !!tokenRecord?.eaTokenHash,
  });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasBrokerAutomationAccess(user)) return NextResponse.json({ error: "Broker plan required" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Risk must be between 0.05% and 0.5%" }, { status: 400 });
  const mode = parsed.data.mode ?? user.brokerAutomationMode ?? "normal";
  const modeChanged = mode !== (user.brokerAutomationMode ?? "normal");
  if (mode === "scalping" && parsed.data.riskPercent > 0.05) {
    return NextResponse.json({ error: "Candle-based demo scalping is capped at 0.05% risk per trade" }, { status: 400 });
  }
  if (parsed.data.enabled) {
    const credential = await User.findById(user._id).select("+eaTokenHash");
    if (!credential?.eaTokenHash) {
      return NextResponse.json({ error: "Create an MT5 device token before enabling automation" }, { status: 400 });
    }
    const heartbeatFresh = !!user.mt5LastHeartbeatAt && Date.now() - user.mt5LastHeartbeatAt.getTime() <= 45_000;
    if (!heartbeatFresh) return NextResponse.json({ error: "MT5 is not connected right now. Start the bridge and EA, then wait for a fresh heartbeat before activating." }, { status: 409 });
    const runtime = user.mt5Runtime;
    if (!runtime?.executionEnabled) return NextResponse.json({ error: "EA execution is off. Set ExecutionEnabled=true in the MT5 EA inputs on your demo account, then wait for its heartbeat." }, { status: 409 });
    if (!runtime.terminalTradeAllowed || !runtime.accountTradeAllowed || !runtime.expertTradeAllowed) {
      return NextResponse.json({ error: "MT5 trade permissions are off. Enable Algo Trading and account/Expert Advisor trading permissions, then retry." }, { status: 409 });
    }
    if (!runtime.demoAccount || runtime.liveTradingAllowed) {
      return NextResponse.json({ error: "Activation requires an MT5 demo account with AllowLiveAccount=false." }, { status: 409 });
    }
    if (mode === "scalping" && !runtime.chartM1) {
      return NextResponse.json({ error: "M1 Scalping activation requires the EA attached to an M1 chart." }, { status: 409 });
    }
  }
  if (modeChanged) {
    const latestSignal = await Analysis.findOne({
      userId: user._id,
      published: true,
      signalStatus: "active",
      direction: { $in: ["buy", "sell"] },
    }).sort({ _id: -1 }).select("_id").lean();
    user.brokerAutomationMode = mode;
    user.mt5LastSignalId = latestSignal?._id.toString() ?? null;
    user.mt5LeaseSignalId = null;
    user.mt5LeaseUntil = null;
    user.brokerRiskPercent = mode === "scalping" ? Math.min(parsed.data.riskPercent, 0.05) : parsed.data.riskPercent;
  }
  user.brokerAutomationMode = mode;
  user.brokerAutomationEnabled = parsed.data.enabled;
  user.brokerRiskPercent = parsed.data.riskPercent;
  await user.save();
  return NextResponse.json({ enabled: user.brokerAutomationEnabled, mode: user.brokerAutomationMode, riskPercent: user.brokerRiskPercent });
}

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasBrokerAutomationAccess(user)) return NextResponse.json({ error: "Broker plan required" }, { status: 403 });
  const token = `lvea_${randomBytes(32).toString("base64url")}`;
  user.eaTokenHash = createHash("sha256").update(token).digest("hex");
  const latestSignal = await Analysis.findOne({
    userId: user._id,
    published: true,
    signalStatus: "active",
    direction: { $in: ["buy", "sell"] },
  }).sort({ _id: -1 }).select("_id").lean();
  user.mt5LastSignalId = latestSignal?._id.toString() ?? null;
  user.mt5LeaseSignalId = null;
  user.mt5LeaseUntil = null;
  user.mt5LastHeartbeatAt = null;
  user.brokerAutomationEnabled = false;
  await user.save();
  return NextResponse.json({ token, warning: "Copy this token now. It cannot be shown again." });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  user.eaTokenHash = null;
  user.brokerAutomationEnabled = false;
  user.mt5LeaseSignalId = null;
  user.mt5LeaseUntil = null;
  user.mt5LastHeartbeatAt = null;
  await user.save();
  return NextResponse.json({ revoked: true, enabled: false });
}
