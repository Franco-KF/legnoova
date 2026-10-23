import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/models/AuditLog";

const { auth } = NextAuth(authConfig);

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

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const method = req.method ?? "GET";
  const ip = getClientIp(req);

  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  const isProtectedApp = pathname.startsWith(PROTECTED_PREFIX);
  const isProtectedApi = API_PROTECTED.some((p) => pathname.startsWith(p));

  // Rate limit auth routes (login/register) per IP to slow brute force.
  if (isAuthRoute && method === "POST") {
    const limited = rateLimitResponse(
      rateLimit(req, { key: `auth:${ip}`, limit: 10, windowMs: 60 * 60 * 1000 })
    );
    if (limited) {
      await recordSecurityEvent({
        type: "rate_limit_exceeded",
        ip,
        userAgent: req.headers.get("user-agent") ?? null,
        details: { path: pathname, method },
        severity: "high",
      });
      return limited;
    }
  }

  // Redirect authenticated users away from login/register
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  // Protect /app routes
  if (isProtectedApp && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Protect account APIs
  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CSRF: state-changing API calls must include X-Requested-With: XMLHttpRequest.
  // Browsers will not allow a cross-origin request to set a custom header without
  // a CORS preflight, which our API does not permit, so this blocks cross-site
  // form POST and fetch attacks.
  if (isProtectedApi && STATE_CHANGING.has(method)) {
    const provided = req.headers.get(CSRF_HEADER);
    if (provided !== CSRF_HEADER_VALUE) {
      await recordSecurityEvent({
        type: "csrf_failure",
        ip,
        userAgent: req.headers.get("user-agent") ?? null,
        details: { method, path: pathname, header: provided ?? "missing" },
        severity: "high",
      });
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  return NextResponse.next();
});

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
