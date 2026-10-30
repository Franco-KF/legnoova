import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/token";
import {
  rateLimitAsync,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { rejectCrossOrigin, requestMeta } from "@/lib/auth/request";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req);
  if (crossOrigin) return crossOrigin;

  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "auth:reset-password",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })
  );
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => null);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and contain a letter and a number",
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    await dbConnect();

    // Tokens are stored hashed, so a database leak cannot be replayed.
    const resetToken = await PasswordResetToken.findOne({
      token: hashToken(token),
    });
    if (!resetToken || resetToken.used) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      await PasswordResetToken.findOneAndDelete({ token: hashToken(token) });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const user = await User.findById(resetToken.userId);
    if (!user) {
      return NextResponse.json(
        { error: "This account no longer exists." },
        { status: 400 }
      );
    }

    user.passwordHash = await hashPassword(password);
    await user.save();

    resetToken.used = true;
    await resetToken.save();
    await PasswordResetToken.deleteMany({
      userId: user._id,
      used: false,
    });

    const { ip, userAgent } = requestMeta(req);
    try {
      await recordSecurityEvent({
        type: "password_reset",
        userId: user._id.toString(),
        ip,
        userAgent,
        details: { method: "email_token" },
        severity: "medium",
      });
    } catch {
      /* non-critical */
    }

    return NextResponse.json(
      {
        message:
          "Your password has been reset successfully. You can now sign in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
