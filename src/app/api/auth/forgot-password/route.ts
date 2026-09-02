import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { generateToken } from "@/lib/auth/token";
import { sendEmail } from "@/lib/email";
import { passwordResetHtml, passwordResetText } from "@/emails/password-reset";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const EXPIRES_HOURS = 1;

export async function POST(req: Request) {
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

    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (!user) {
      // Always respond the same to avoid user enumeration
      return NextResponse.json(
        { message: "If an account exists for that email, a reset link has been sent." },
        { status: 200 }
      );
    }

    const token = generateToken();
    const expires = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

    await PasswordResetToken.deleteMany({ userId: user._id, used: false });
    await PasswordResetToken.create({
      token,
      userId: user._id,
      expires,
      used: false,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const html = passwordResetHtml({ resetUrl, expiresInHours: EXPIRES_HOURS });
    const text = passwordResetText({ resetUrl, expiresInHours: EXPIRES_HOURS });

    await sendEmail({
      to: user.email,
      subject: "Reset your Legnoova password",
      html,
      text,
    });

    return NextResponse.json(
      { message: "If an account exists for that email, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}