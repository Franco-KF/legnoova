import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { AUTH, sessionCookieOptions } from "./config";
import {
  claimsToSession,
  signSessionToken,
  verifySessionToken,
} from "./token";
import type { Session, SessionUser } from "./types";

/**
 * Server-side session helpers.
 *
 * Sessions are stateless: the cookie contains a signed JWT and `auth()` only
 * performs an HMAC check. No database round-trip is needed for the vast
 * majority of requests.
 */

export async function createSession(user: SessionUser): Promise<string> {
  const token = signSessionToken(user);
  const store = await cookies();
  store.set(AUTH.cookieName, token, sessionCookieOptions());
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(AUTH.cookieName, "", sessionCookieOptions(0));
}

/**
 * Attach a session cookie directly to a route-handler response.
 *
 * This is the most reliable path when the handler returns a freshly-created
 * `NextResponse` (login, OAuth callback, session refresh).
 */
export function applySessionCookie(
  response: NextResponse,
  user: SessionUser
): string {
  const token = signSessionToken(user);
  response.cookies.set(AUTH.cookieName, token, sessionCookieOptions());
  return token;
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(AUTH.cookieName, "", sessionCookieOptions(0));
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH.cookieName)?.value ?? null;
}

/** Drop-in replacement for NextAuth's `auth()`. */
export async function auth(): Promise<Session | null> {
  const token = await getSessionToken();
  const claims = verifySessionToken(token);
  return claims ? claimsToSession(claims) : null;
}

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
