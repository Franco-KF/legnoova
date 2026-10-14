import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { PaymentMethod } from "@/models/PaymentMethod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Accepts ONLY non-sensitive card metadata. `.strict()` rejects any stray
 * field (e.g. a full card number or CVC), so sensitive data can never be
 * persisted even if a client tries to send it.
 */
const createSchema = z
  .object({
    brand: z
      .enum(["visa", "mastercard", "amex", "discover", "unknown"])
      .default("unknown"),
    last4: z.string().regex(/^\d{4}$/, "last4 must be 4 digits"),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(2000).max(2100),
    name: z.string().trim().min(1).max(100).optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const methods = await PaymentMethod.find({ userId: session.user.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      methods: methods.map((m) => ({
        id: m._id.toString(),
        brand: m.brand,
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        name: m.name ?? null,
        isDefault: !!m.isDefault,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("PaymentMethod GET error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimitResponse(
      rateLimit(req, { key: "payment-methods", limit: 20, windowMs: 60 * 1000 })
    );
    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingCount = await PaymentMethod.countDocuments({
      userId: session.user.id,
    });
    const makeDefault = parsed.data.isDefault || existingCount === 0;

    if (makeDefault) {
      await PaymentMethod.updateMany(
        { userId: session.user.id },
        { $set: { isDefault: false } }
      );
    }

    const method = await PaymentMethod.create({
      userId: session.user.id,
      brand: parsed.data.brand,
      last4: parsed.data.last4,
      expMonth: parsed.data.expMonth,
      expYear: parsed.data.expYear,
      name: parsed.data.name,
      isDefault: makeDefault,
    });

    return NextResponse.json(
      {
        method: {
          id: method._id.toString(),
          brand: method.brand,
          last4: method.last4,
          expMonth: method.expMonth,
          expYear: method.expYear,
          name: method.name ?? null,
          isDefault: method.isDefault,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PaymentMethod POST error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
