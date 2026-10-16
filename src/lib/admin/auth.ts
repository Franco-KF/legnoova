import crypto from "node:crypto";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/password";

/**
 * Standalone admin session.
 *
 * Kept independent from the end-user NextAuth session: a signed, HMAC-protected
 * cookie identifies the admin. Credentials come from the environment so no
 * admin account has to exist in the user database.
 */

export const ADMIN_COOKIE = "legnoova_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 8; // 8 hours

type AdminPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const expectedEmail = adminEmail();
  if (!expectedEmail || email.trim().toLowerCase() !== expectedEmail) {
    return false;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyPassword(password, hash);

  const plain = process.env.ADMIN_PASSWORD;
  if (plain) return safeEqual(password, plain);

  return false;
}

export function createAdminToken(): string {
  const payload: AdminPayload = {
    sub: adminEmail(),
    iat: Date.now(),
    exp: Date.now() + ADMIN_MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  if (!safeEqual(signature, sign(body))) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as AdminPayload;
    return payload.exp > Date.now() && payload.sub === adminEmail();
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}
