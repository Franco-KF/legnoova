import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { PaymentMethod } from "@/models/PaymentMethod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { encryptCard, encryptPaymentField } from "@/lib/card-crypto";

/**
 * The full PAN, expiry, and cardholder name are encrypted before persistence.
 * Security codes (CVV/CVC) are intentionally rejected and never stored.
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
    cardNumber: z.string().regex(/^\d{12,19}$/, "Enter a valid card number"),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(2000).max(2100),
    name: z.string().trim().min(1).max(100).optional(),
    companyCode: z.string().regex(/^\d{3}$/, "Enter your 3-digit Legnoova customer code"),
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine((value) => passesLuhn(value.cardNumber), { path: ["cardNumber"], message: "Enter a valid card number" });

function passesLuhn(value: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = Number(value[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

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
          last4: m.last4 ?? "",
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
      card: encryptCard(parsed.data.cardNumber),
      last4: parsed.data.cardNumber.slice(-4),
      expMonthEncrypted: encryptPaymentField(String(parsed.data.expMonth)),
      expYearEncrypted: encryptPaymentField(String(parsed.data.expYear)),
      nameEncrypted: encryptPaymentField(parsed.data.name ?? ""),
      companyCodeEncrypted: encryptPaymentField(parsed.data.companyCode),
      isDefault: makeDefault,
    });

    return NextResponse.json(
      {
        method: {
          id: method._id.toString(),
          brand: method.brand,
          last4: method.last4,
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
