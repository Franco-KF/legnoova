import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";

export const runtime = "nodejs";

const USER_FIELDS =
  "+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt " +
  "brokerAutomationEnabled brokerAutomationMode brokerRiskPercent " +
  "mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil mt5LastHeartbeatAt mt5Runtime";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select(USER_FIELDS);
  if (!user) return new NextResponse("User not found", { status: 404 });
  if (!hasBrokerAutomationAccess(user)) {
    return NextResponse.json(
      { error: "An active MT5 Broker subscription is required" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stop = () => {
    closed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          stop();
        }
      };

      const pushDiagnostics = async () => {
        if (closed) return;
        try {
          const freshUser = await User.findById(user._id).select(USER_FIELDS);
          if (!freshUser || closed) return;
          const diag = await getAutomationDiagnostics(freshUser);
          send({ type: "diagnostics", data: diag, ts: Date.now() });
        } catch {
          send({ type: "error", message: "diagnostics refresh failed" });
        }
      };

      send({ type: "connected", ts: Date.now() });
      void pushDiagnostics();
      heartbeat = setInterval(() => void pushDiagnostics(), 5000);
    },
    cancel() {
      stop();
    },
  });

  req.signal.addEventListener("abort", stop, { once: true });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
