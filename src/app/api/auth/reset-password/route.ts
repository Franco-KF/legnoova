import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { hashPassword } from "@/lib/auth/password";

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
  try {
    const body = await req.json().catch(() => null);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and contain a letter and a number" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    await dbConnect();

    const resetToken = await PasswordResetToken.findOne({ token });
    if (!resetToken || resetToken.used) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      await PasswordResetToken.findOneAndDelete({ token });
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

    const passwordHash = await hashPassword(password);
    user.passwordHash = passwordHash;
    await user.save();

    resetToken.used = true;
    await resetToken.save();

    return NextResponse.json(
      { message: "Your password has been reset successfully. You can now sign in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}