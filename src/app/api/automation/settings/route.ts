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
  riskPercent: z.number().min(0.1).max(0.5),
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
    riskPercent: user.brokerRiskPercent ?? 0.5,
    tokenIssued: !!tokenRecord?.eaTokenHash,
  });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasBrokerAutomationAccess(user)) return NextResponse.json({ error: "Broker plan required" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Risk must be between 0.1% and 0.5%" }, { status: 400 });
  const mode = parsed.data.mode ?? user.brokerAutomationMode ?? "normal";
  const modeChanged = mode !== (user.brokerAutomationMode ?? "normal");
  if (modeChanged && parsed.data.enabled) {
    return NextResponse.json({ error: "Pause automation while changing modes. Save the new mode, then explicitly re-enable it." }, { status: 409 });
  }
  if (mode === "scalping" && parsed.data.riskPercent > 0.25) {
    return NextResponse.json({ error: "Demo scalping mode is capped at 0.25% risk per trade" }, { status: 400 });
  }
  if (parsed.data.enabled) {
    const credential = await User.findById(user._id).select("+eaTokenHash");
    if (!credential?.eaTokenHash) {
      return NextResponse.json({ error: "Create an MT5 device token before enabling automation" }, { status: 400 });
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
    user.brokerAutomationEnabled = false;
    user.brokerRiskPercent = mode === "scalping" ? Math.min(parsed.data.riskPercent, 0.25) : parsed.data.riskPercent;
    await user.save();
    return NextResponse.json({
      enabled: false,
      mode: user.brokerAutomationMode,
      riskPercent: user.brokerRiskPercent,
      warning: "Mode changed, automation paused, and older queued signals skipped. Review the demo safeguards before re-enabling.",
    });
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
  await user.save();
  return NextResponse.json({ revoked: true, enabled: false });
}
