import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { generateToken, hashToken } from "@/lib/auth/token";
import { sendEmail, APP_URL } from "@/lib/email";
import { passwordResetHtml, passwordResetText } from "@/emails/password-reset";
import {
  rateLimitAsync,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { rejectCrossOrigin, requestMeta } from "@/lib/auth/request";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
});

const EXPIRES_HOURS = 1;

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req);
  if (crossOrigin) return crossOrigin;

  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "auth:forgot-password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
  );
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => null);
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: parsed.data.email });
    if (!user) {
      // Always respond the same to avoid user enumeration.
      return NextResponse.json(
        {
          message:
            "If an account exists for that email, a reset link has been sent.",
        },
        { status: 200 }
      );
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expires = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

    await PasswordResetToken.deleteMany({ userId: user._id, used: false });
    await PasswordResetToken.create({
      token: tokenHash,
      userId: user._id,
      expires,
      used: false,
    });

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const html = passwordResetHtml({ resetUrl, expiresInHours: EXPIRES_HOURS });
    const text = passwordResetText({ resetUrl, expiresInHours: EXPIRES_HOURS });

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Legnoova password",
        html,
        text,
      });
    } catch (error) {
      // Do not reveal account existence if the mail provider is down.
      console.error("Password reset email failed:", error);
    }

    const { ip, userAgent } = requestMeta(req);
    try {
      await recordSecurityEvent({
        type: "token_created",
        userId: user._id.toString(),
        ip,
        userAgent,
        details: { action: "password_reset_request" },
        severity: "low",
      });
    } catch {
      /* non-critical */
    }

    return NextResponse.json(
      {
        message:
          "If an account exists for that email, a reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
