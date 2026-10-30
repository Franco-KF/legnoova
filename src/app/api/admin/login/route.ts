import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  createAdminToken,
  verifyAdminCredentials,
} from "@/lib/admin/auth";
import { rejectCrossOrigin, requestMeta } from "@/lib/auth/request";
import {
  rateLimitAsync,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req);
  if (crossOrigin) return crossOrigin;

  const limited = rateLimitResponse(
    await rateLimitAsync(req, {
      key: "auth:admin-login",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
  );
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const valid = await verifyAdminCredentials(
    parsed.data.email,
    parsed.data.password
  );
  if (!valid) {
    const { ip, userAgent } = requestMeta(req);
    try {
      await recordSecurityEvent({
        type: "login_failure",
        ip,
        userAgent,
        details: { scope: "admin", email: parsed.data.email.toLowerCase() },
        severity: "high",
      });
    } catch {
      /* non-critical */
    }
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return res;
}
