import { NextResponse, type NextRequest } from "next/server";
import { AUTH, sessionCookieOptions } from "@/lib/auth/config";
import {
  signSessionFromClaims,
  verifySessionToken,
} from "@/lib/auth/token";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIX = "/app";
const API_PROTECTED = [
  "/api/account",
  "/api/analyze",
  "/api/history",
  "/api/watchlist",
  "/api/automation/settings",
];
const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** CSRF-safe custom header that cross-site requests cannot set without CORS preflight. */
const CSRF_HEADER = "x-requested-with";
const CSRF_HEADER_VALUE = "XMLHttpRequest";

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const method = req.method ?? "GET";
  const ip = getClientIp(req);

  let claims = null;
  try {
    claims = verifySessionToken(req.cookies.get(AUTH.cookieName)?.value);
  } catch {
    // Misconfigured secret should not take the whole site down.
    claims = null;
  }
  const isLoggedIn = !!claims;

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  const isProtectedApp = pathname.startsWith(PROTECTED_PREFIX);
  const isProtectedApi = API_PROTECTED.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Rate limit auth routes (login/register) per IP to slow brute force.
  if (isAuthRoute && method === "POST") {
    const limited = rateLimitResponse(
      rateLimit(req, {
        key: `auth:${ip}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      })
    );
    if (limited) return limited;
  }

  // Redirect authenticated users away from login/register.
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  // Protect /app routes.
  if (isProtectedApp && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Protect account APIs.
  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CSRF: state-changing API calls must include X-Requested-With.
  if (isProtectedApi && STATE_CHANGING.has(method)) {
    if (req.headers.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  // Sliding expiration: re-issue the cookie when it is close to expiring so
  // active users are not logged out mid-session. This is a local HMAC operation
  // (no database call).
  if (claims) {
    const secondsLeft = claims.exp - Math.floor(Date.now() / 1000);
    if (secondsLeft < AUTH.refreshThresholdSeconds) {
      try {
        response.cookies.set(
          AUTH.cookieName,
          signSessionFromClaims(claims),
          sessionCookieOptions()
        );
      } catch {
        /* keep the existing cookie if re-signing fails */
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/app/:path*",
    "/api/account/:path*",
    "/api/analyze/:path*",
    "/api/history/:path*",
    "/api/watchlist/:path*",
    "/api/automation/settings/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
