/**
 * Central auth configuration.
 *
 * Everything is driven by the environment variables that already ship with the
 * project (AUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, ...). Optional tuning
 * knobs fall back to safe defaults so existing deployments keep working.
 */

const ttlDays = Number(process.env.AUTH_SESSION_TTL_DAYS ?? "7");
const sessionTtlSeconds = Math.round(
  (Number.isFinite(ttlDays) && ttlDays > 0 ? Math.min(ttlDays, 30) : 7) * 86400
);

export const AUTH = {
  /** Name of the signed session cookie (kept compatible with the old name). */
  cookieName: process.env.AUTH_COOKIE_NAME?.trim() || "lv_session",
  /** Short-lived cookie used during the Google OAuth handshake. */
  oauthCookieName: "lv_oauth",
  /** Standalone admin cookie (separate from end-user sessions). */
  adminCookieName: "legnoova_admin",

  /** Stateless session lifetime. */
  sessionTtlSeconds,
  /** Re-issue the cookie once less than this many seconds remain. */
  refreshThresholdSeconds: 24 * 60 * 60,
  /** Admin session lifetime (8 hours). */
  adminTtlSeconds: 8 * 60 * 60,

  /** Token issuer / audience claims. */
  issuer: "legnoova",
  audience: "legnoova-web",
  adminAudience: "legnoova-admin",
} as const;

/** Resolve the signing secret lazily so builds without env vars still compile. */
export function authSecret(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET_BASE64;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32"
    );
  }
  return secret;
}

/** Public base URL used for OAuth callbacks and absolute links. */
export function appUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/+$/, "");
}

export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function sessionCookieOptions(
  maxAge: number = AUTH.sessionTtlSeconds
): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function oauthCookieOptions(maxAge = 10 * 60): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
