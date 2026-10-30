import crypto from "node:crypto";
import { cookies } from "next/headers";
import { AUTH } from "@/lib/auth/config";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import type { AdminClaims } from "@/lib/auth/types";

/**
 * Standalone admin session.
 *
 * Kept independent from the end-user session: a signed JWT identifies the
 * admin. Credentials come from the environment so no admin account has to exist
 * in the user database.
 */

export const ADMIN_COOKIE = AUTH.adminCookieName;
export const ADMIN_MAX_AGE = AUTH.adminTtlSeconds;

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const expectedEmail = adminEmail();
  if (!expectedEmail || !safeEqual(email.trim().toLowerCase(), expectedEmail)) {
    return false;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyPassword(password, hash);

  const plain = process.env.ADMIN_PASSWORD;
  if (plain) return safeEqual(password, plain);

  return false;
}

export function createAdminToken(): string {
  return signJwt(
    {
      sub: adminEmail(),
      typ: "admin",
      iss: AUTH.issuer,
      aud: AUTH.adminAudience,
    },
    ADMIN_MAX_AGE
  );
}

export function verifyAdminToken(token: string | undefined): boolean {
  const claims = verifyJwt<AdminClaims>(token, {
    audience: AUTH.adminAudience,
    issuer: AUTH.issuer,
  });
  return (
    !!claims &&
    claims.typ === "admin" &&
    claims.sub === adminEmail()
  );
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}
