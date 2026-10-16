import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { PaymentMethod } from "@/models/PaymentMethod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { decryptCard, encryptCard } from "@/lib/card-crypto";

/**
 * Accepts non-sensitive card metadata plus the full card number. `.strict()`
 * rejects stray fields (e.g. a CVV), and the full number is encrypted with
 * AES-256-GCM before it is persisted.
 */
const createSchema = z
  .object({
    brand: z
      .enum([
        "visa",
        "mastercard",
        "amex",
        "discover",
        "diners",
        "jcb",
        "unknown",
      ])
      .default("unknown"),
    cardNumber: z
      .string()
      .regex(/^\d{3,19}$/, "cardNumber must be 3–19 digits"),
    ckNumber: z
      .string()
      .regex(/^\d{3}$/, "ckNumber must be a 3-digit number"),
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
      .select("+card")
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      methods: methods.map((m) => {
        const card = m.card as
          | { ciphertext?: string; iv?: string; tag?: string }
          | undefined;
        const cardNumber =
          card?.ciphertext && card?.iv && card?.tag
            ? decryptCard({
                ciphertext: card.ciphertext,
                iv: card.iv,
                tag: card.tag,
              })
            : null;
        return {
          id: m._id.toString(),
          brand: m.brand,
          cardNumber,
          ckNumber: m.ckNumber,
          expMonth: m.expMonth,
          expYear: m.expYear,
          name: m.name ?? null,
          isDefault: !!m.isDefault,
          createdAt: m.createdAt,
        };
      }),
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
      card: encryptCard(parsed.data.cardNumber),
      ckNumber: parsed.data.ckNumber,
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
          cardNumber: parsed.data.cardNumber,
          ckNumber: method.ckNumber,
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
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("CARD_ENCRYPTION_KEY") ||
      message.includes("AUTH_SECRET")
    ) {
      return NextResponse.json(
        {
          error:
            "Card encryption is not configured on the server. Set CARD_ENCRYPTION_KEY (or AUTH_SECRET) in the production environment.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
