import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User, type PlanId } from "@/models/User";
import { verifyPaddleSignature } from "@/lib/paddle";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface PaddleEvent {
  event_type: string;
  event_id?: string;
  data: {
    id?: string;
    status?: string;
    custom_id?: string | null;
    customer_id?: string | null;
    items?: Array<{
      price?: { id?: string; custom_data?: Record<string, unknown> | null };
      custom_data?: Record<string, unknown> | null;
    }>;
    custom_data?: Record<string, unknown> | null;
    current_period_end?: string | null;
    scheduled_change?: { action?: string } | null;
  };
}

const PLAN_BY_PRICE_ENV = {
  analyze: process.env.NEXT_PUBLIC_PADDLE_PRICE_ANALYZE,
  broker: process.env.NEXT_PUBLIC_PADDLE_PRICE_BROKER,
} as const;

function planForPriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null;
  if (priceId === PLAN_BY_PRICE_ENV.analyze) return "analyze";
  if (priceId === PLAN_BY_PRICE_ENV.broker) return "broker";
  return null;
}

function planFromEvent(evt: PaddleEvent): PlanId | null {
  const custom = evt.data.custom_data as { planId?: string } | null;
  if (custom?.planId === "analyze" || custom?.planId === "broker") {
    return custom.planId;
  }
  for (const item of evt.data.items ?? []) {
    const plan = planForPriceId(item.price?.id);
    if (plan) return plan;
  }
  return null;
}

async function findUser(evt: PaddleEvent): Promise<InstanceType<typeof User> | null> {
  const custom = evt.data.custom_data as { userId?: string } | null;
  if (custom?.userId) {
    const byId = await User.findById(custom.userId);
    if (byId) return byId;
  }
  if (evt.data.customer_id) {
    return User.findOne({ paddleCustomerId: evt.data.customer_id });
  }
  return null;
}

/**
 * Paddle webhook — the single source of truth for subscription state.
 * Every request must carry a valid Paddle-Signature; unsigned or replayed
 * requests are rejected before touching the database.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(
      rateLimit(req, { key: "paddle-webhook", limit: 120, windowMs: 60 * 1000 })
    );
    if (limited) return limited;

    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhooks not configured" }, { status: 503 });
    }

    const rawBody = await req.text();
    const valid = verifyPaddleSignature(
      rawBody,
      req.headers.get("paddle-signature"),
      secret
    );
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const evt = JSON.parse(rawBody) as PaddleEvent;
    await dbConnect();

    switch (evt.event_type) {
      case "transaction.completed": {
        if (evt.data.status !== "completed") break;
        const user = await findUser(evt);
        if (!user) break;
        user.plan = planFromEvent(evt) ?? user.plan ?? "analyze";
        user.planStatus = "active";
        if (evt.data.customer_id) user.paddleCustomerId = evt.data.customer_id;
        await user.save();
        break;
      }

      case "subscription.activated":
      case "subscription.resumed":
      case "subscription.updated": {
        const user = await findUser(evt);
        if (!user) break;
        const status = evt.data.status;
        user.paddleSubscriptionId = evt.data.id ?? user.paddleSubscriptionId;
        if (evt.data.customer_id) user.paddleCustomerId = evt.data.customer_id;
        if (evt.data.current_period_end) {
          user.planCurrentPeriodEnd = new Date(evt.data.current_period_end);
        }
        if (status === "active" || status === "trialing") {
          user.plan = planFromEvent(evt) ?? user.plan ?? "analyze";
          user.planStatus = "active";
        } else if (status === "past_due" || status === "paused") {
          user.planStatus = "past_due";
        }
        await user.save();
        break;
      }

      case "subscription.canceled": {
        const user = await findUser(evt);
        if (!user) break;
        const periodEnd = evt.data.current_period_end
          ? new Date(evt.data.current_period_end)
          : new Date();
        // Keep the plan until the end of the paid period, then downgrade.
        if (periodEnd <= new Date()) {
          user.plan = null;
          user.planStatus = null;
        } else {
          user.planStatus = "canceled";
          user.planCurrentPeriodEnd = periodEnd;
        }
        await user.save();
        break;
      }

      default:
        // Unhandled event types are acknowledged so Paddle stops retrying.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
