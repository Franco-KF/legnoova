import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIX = "/app";
const API_PROTECTED = [
  "/api/account",
  "/api/analyze",
  "/api/history",
  "/api/watchlist",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const pathname = nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isProtectedApp = pathname.startsWith(PROTECTED_PREFIX);
  const isProtectedApi = API_PROTECTED.some((p) => pathname.startsWith(p));

  // Redirect authenticated users away from login/register
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/app", nextUrl));
  }

  // Protect /app routes
  if (isProtectedApp && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect account APIs
  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/app/:path*",
    "/api/account/:path*",
    "/api/analyze/:path*",
    "/api/history/:path*",
    "/api/watchlist/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
