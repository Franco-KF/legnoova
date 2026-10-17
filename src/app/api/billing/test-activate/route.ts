import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getTrialEnd } from "@/config/billing";

/**
 * TEST-ONLY activation. Simulates a successful payment so the paywall can be
 * exercised without a real processor.
 *
 * Disabled in production unless PAYMENTS_TEST_MODE=true. When enabled it grants
 * the account an active plan directly — never use this to serve real customers.
 */
const schema = z.object({
  planId: z.enum(["analyze", "broker"]),
});

function testModeEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.PAYMENTS_TEST_MODE === "true"
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!testModeEnabled()) {
      return NextResponse.json(
        { error: "Test activation is disabled on this environment." },
        { status: 403 }
      );
    }

    const limited = rateLimitResponse(
      rateLimit(req, { key: "test-activate", limit: 10, windowMs: 60 * 1000 })
    );
    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.plan = parsed.data.planId;
    user.planStatus = "trialing";
    user.trialEndsAt = getTrialEnd();
    await user.save();

    return NextResponse.json({
      ok: true,
      plan: user.plan,
      status: user.planStatus,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      testMode: true,
    });
  } catch (error) {
    console.error("Test activate error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
