import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { isPaddleConfigured } from "@/lib/paddle";
import { PLANS } from "@/config/plans";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  planId: z.enum(["analyze", "broker"]),
});

/**
 * Returns everything the client needs to open a Paddle.js overlay checkout.
 * The checkout itself runs client-side, but the authoritative record of a
 * purchase is the signed webhook — never the client.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimitResponse(
      rateLimit(req, { key: "billing-checkout", limit: 20, windowMs: 60 * 1000 })
    );
    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS.find((p) => p.id === parsed.data.planId);
    if (!plan || !plan.priceId) {
      return NextResponse.json(
        { error: "This plan is not available for purchase yet." },
        { status: 400 }
      );
    }

    if (!isPaddleConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured yet. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      priceId: plan.priceId,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
        ? "production"
        : "sandbox",
      customer: { email: session.user.email },
      // Echoed back in webhook events so we can trust the buyer's identity.
      customData: { userId: session.user.id },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
