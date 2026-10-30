import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { applySessionCookie } from "@/lib/auth/session";
import {
  hashPassword,
  simulatePasswordCheck,
  verifyPasswordDetailed,
} from "@/lib/auth/password";
import {
  checkLoginThrottle,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/security/brute-force";
import { recordSecurityEvent } from "@/models/AuditLog";
import {
  getClientIp,
  rateLimitAsync,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { rejectCrossOrigin } from "@/lib/auth/request";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req);
  if (crossOrigin) return crossOrigin;

  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "auth:login",
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })
  );
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    const throttle = await checkLoginThrottle(email);
    if (!throttle.allowed) {
      await recordSecurityEvent({
        type: "login_lockout",
        ip,
        userAgent,
        details: {
          email,
          retryAfterSec: throttle.retryAfterSec,
        },
        severity: "high",
      });
      return NextResponse.json(
        {
          error: "Too many attempts. Please try again later.",
          retryAfterSec: throttle.retryAfterSec,
        },
        {
          status: 429,
          headers: throttle.retryAfterSec
            ? { "Retry-After": String(throttle.retryAfterSec) }
            : undefined,
        }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user?.passwordHash) {
      // Equalize timing with a real scrypt verification for unknown accounts.
      await simulatePasswordCheck(password);
      await recordLoginFailure(email, ip, userAgent);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const result = await verifyPasswordDetailed(password, user.passwordHash);
    if (!result.valid) {
      await recordLoginFailure(email, ip, userAgent);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Transparently upgrade legacy bcrypt hashes to native scrypt.
    if (result.needsRehash) {
      try {
        user.passwordHash = await hashPassword(password);
        await user.save();
      } catch (error) {
        console.error("Password rehash failed:", error);
      }
    }

    await recordLoginSuccess(email, ip, userAgent);

    const sessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image ?? null,
      plan: user.plan ?? null,
      brokerAutomationEnabled: !!user.brokerAutomationEnabled,
    };

    const response = NextResponse.json(
      { ok: true, user: sessionUser },
      { headers: { "Cache-Control": "no-store" } }
    );
    applySessionCookie(response, sessionUser);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
