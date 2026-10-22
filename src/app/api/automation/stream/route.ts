import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";

export const runtime = "nodejs";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return new NextResponse("User not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const heartbeat = setInterval(async () => {
        try {
          const freshUser = await User.findById(user._id).select("mt5LastHeartbeatAt mt5Runtime brokerAutomationEnabled brokerAutomationMode brokerRiskPercent");
          if (!freshUser) return;
          const diag = await getAutomationDiagnostics(freshUser);
          send({ type: "diagnostics", data: diag, ts: Date.now() });
        } catch {
          send({ type: "error", message: "diagnostics refresh failed" });
        }
      }, 5000);

      send({ type: "connected", ts: Date.now() });

      return () => {
        clearInterval(heartbeat);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
