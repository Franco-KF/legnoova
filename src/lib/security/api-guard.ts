import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { validateCsrf, issueCsrfToken } from "@/lib/security/csrf";
import { SECURITY } from "@/lib/security/config";
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
    const cookieStore = await cookies();
    const cookieToken = (cookieStore.get(SECURITY.CSRF_COOKIE_NAME) as { value: string } | undefined)?.value ?? null;
    const headerToken = headersList.get(SECURITY.CSRF_HEADER_NAME) ?? null;

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
      const validation = validateCsrf(cookieToken, headerToken);
      if (!validation.ok) {
        await recordSecurityEvent({
          type: "csrf_failure",
          ip,
          userAgent: headersList.get("user-agent") ?? null,
          details: { method, reason: validation.reason, path: new URL(req.url).pathname },
          severity: "high",
        });
        return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    }

    // Issue a fresh CSRF cookie on read-only responses so clients always have a current token.
    const result = await handler(req, {
      csrfToken: options.skipCsrf ? null : cookieToken,
      skipCsrf: !!options.skipCsrf,
      userId: options.userId ?? null,
      ip,
    });

    if (!options.skipCsrf && (method === "GET" || method === "HEAD" || method === "OPTIONS")) {
      const token = await issueCsrfToken(result.headers);
      result.headers.set(SECURITY.CSRF_HEADER_NAME, token);
    }

    return result;
  };
}
