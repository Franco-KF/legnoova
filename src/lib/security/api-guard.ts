import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isCsrfSafeRequest } from "@/lib/security/csrf";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/models/AuditLog";

export interface ApiGuardOptions {
  csrfMethods?: Set<string>;
  rateLimitKey: string;
  rateLimit: number;
  rateLimitWindowMs: number;
  skipCsrf?: boolean;
  userId?: string | null;
}

/**
 * Wraps a Next.js route handler with CSRF enforcement, rate limiting,
 * and security audit logging.
 */
export function apiGuard(
  options: ApiGuardOptions,
  handler: (req: Request, ctx: { csrfToken: string | null; skipCsrf: boolean; userId: string | null; ip: string }) => Promise<NextResponse>
) {
  const csrfMethods = options.csrfMethods ?? new Set(["POST", "PUT", "PATCH", "DELETE"]);

  return async (req: Request): Promise<NextResponse> => {
    const ip = getClientIp(req);
    const method = req.method;
    const headersList = await headers();

    // Rate limit (per IP + key).
    const limited = rateLimitResponse(
      rateLimit(req, {
        key: `${options.rateLimitKey}:${ip}`,
        limit: options.rateLimit,
        windowMs: options.rateLimitWindowMs,
      })
    );
    if (limited) {
      await recordSecurityEvent({
        type: "rate_limit_exceeded",
        ip,
        userAgent: headersList.get("user-agent") ?? null,
        details: { key: options.rateLimitKey, method, path: new URL(req.url).pathname },
        severity: "medium",
      });
      return limited;
    }

    // CSRF enforcement for state-changing methods.
    if (!options.skipCsrf && csrfMethods.has(method)) {
      if (!isCsrfSafeRequest(req)) {
        await recordSecurityEvent({
          type: "csrf_failure",
          ip,
          userAgent: headersList.get("user-agent") ?? null,
          details: { method, reason: "csrf_header_or_origin_missing", path: new URL(req.url).pathname },
          severity: "high",
        });
        return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    }

    return handler(req, {
      csrfToken: null,
      skipCsrf: !!options.skipCsrf,
      userId: options.userId ?? null,
      ip,
    });
  };
}
