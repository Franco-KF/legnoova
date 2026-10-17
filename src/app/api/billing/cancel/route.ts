import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { isPaddleConfigured, paddleApi } from "@/lib/paddle";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Cancel the signed-in user's subscription.
 *
 * The cancellation is scheduled for the end of the current billing period
 * ("next_billing_period"), so the customer keeps everything they've paid for
 * until then — the best-practice, no-surprise approach. When Paddle is
 * configured we ask the processor to cancel and let the signed webhook confirm
 * the state change; otherwise we mark it locally (test/manual mode).
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimitResponse(
      rateLimit(req, { key: "billing-cancel", limit: 10, windowMs: 60 * 1000 })
    );
    if (limited) return limited;

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.plan) {
      return NextResponse.json(
        { error: "You don't have an active subscription to cancel." },
        { status: 400 }
      );
    }

    if (user.planStatus === "canceled") {
      return NextResponse.json({ ok: true, status: "canceled" });
    }

    if (isPaddleConfigured() && user.paddleSubscriptionId) {
      await paddleApi(`/subscriptions/${user.paddleSubscriptionId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ effective_from: "next_billing_period" }),
      });
    }

    user.planStatus = "canceled";
    await user.save();

    return NextResponse.json({
      ok: true,
      status: user.planStatus,
      accessUntil:
        user.planCurrentPeriodEnd?.toISOString() ??
        user.trialEndsAt?.toISOString() ??
        null,
    });
  } catch (error) {
    console.error("Billing cancel error:", error);
    return NextResponse.json(
      { error: "Could not cancel your subscription. Please try again." },
      { status: 500 }
    );
  }
}
