import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export async function POST(req: Request) {
  try {
    const limited = rateLimitResponse(
      rateLimit(req, { key: "register", limit: 5, windowMs: 15 * 60 * 1000 })
    );
    if (limited) return limited;

    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      // If user exists via OAuth but has no password, allow them to add a password
      if (existing.passwordHash) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    let user;
    if (existing && !existing.passwordHash) {
      existing.passwordHash = passwordHash;
      user = await existing.save();
    } else {
      user = await User.create({
        name,
        email,
        passwordHash,
      });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}