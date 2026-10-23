import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SECURITY } from "@/lib/security/config";

/**
 * Double-submit CSRF protection.
 *
 * The server sets a cryptographically random CSRF token in a
 * SameSite=Strict, HttpOnly, Secure cookie. Every state-changing request
 * (POST/PUT/PATCH/DELETE) must echo the same token in the
 * `X-CSRF-Token` header. The server compares cookie vs header in
 * constant time. GET/HEAD/OPTIONS are exempt.
 *
 * This defeats CSRF because an attacker's cross-origin request cannot
 * read the HttpOnly cookie, and therefore cannot forge the matching header.
 */

const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET || CSRF_SECRET.length < 32) {
  throw new Error(
    "CSRF_SECRET must be set to at least 32 random characters (openssl rand -hex 32)"
  );
}

function generateToken(): string {
  return createHash("sha256")
    .update(CSRF_SECRET + crypto.randomUUID() + Date.now().toString())
    .digest("hex");
}

export async function getCsrfCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    return (store.get(SECURITY.CSRF_COOKIE_NAME) as { value: string } | undefined)
      ?.value ?? null;
  } catch {
    return null;
  }
}

export async function setCsrfCookie(response: Headers, token: string): Promise<void> {
  response.set(
    "Set-Cookie",
    `${SECURITY.CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SECURITY.SESSION_MAX_AGE}`
  );
}

export async function clearCsrfCookie(response: Headers): Promise<void> {
  response.set(
    "Set-Cookie",
    `${SECURITY.CSRF_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
}

/** Validate a CSRF token from the header against the cookie. Returns the token if valid. */
export function validateCsrf(
  cookieToken: string | null,
  headerToken: string | null
): { ok: boolean; token?: string; reason?: string } {
  if (!cookieToken || cookieToken === SECURITY.EMPTY_HASH) {
    return { ok: false, reason: "missing_csrf_cookie" };
  }
  if (!headerToken || headerToken.length < 8) {
    return { ok: false, reason: "missing_csrf_header" };
  }
  if (!timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))) {
    return { ok: false, reason: "csrf_token_mismatch" };
  }
  return { ok: true, token: cookieToken };
}

/** Returns a fresh CSRF token and sets it as a cookie on the response. */
export async function issueCsrfToken(response: Headers): Promise<string> {
  const token = generateToken();
  await setCsrfCookie(response, token);
  return token;
}
