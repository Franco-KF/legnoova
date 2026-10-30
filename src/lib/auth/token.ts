import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { AUTH } from "./config";
import { signJwt, verifyJwt } from "./jwt";
import type { Session, SessionClaims, SessionUser } from "./types";

/** Random hex token (password reset, email verification, ...). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** Numeric one-time password. */
export function generateOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  return Math.floor(randomInt(0, max))
    .toString()
    .padStart(digits, "0");
}

/** Hash a bearer token before storing it, so a DB leak cannot be replayed. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newCsrfToken(): string {
  return randomUUID().replace(/-/g, "");
}

export type SessionTokenInput = Omit<SessionClaims, "iat" | "exp" | "jti">;

export function toSessionClaims(user: SessionUser): SessionTokenInput {
  return {
    sub: user.id,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    picture: user.image ?? undefined,
    plan: user.plan ?? null,
    brokerAutomationEnabled: !!user.brokerAutomationEnabled,
    csrf: user.csrf || newCsrfToken(),
    typ: "session",
    iss: AUTH.issuer,
    aud: AUTH.audience,
  };
}

/** Sign a fresh stateless session token. */
export function signSessionToken(
  user: SessionUser,
  ttlSeconds: number = AUTH.sessionTtlSeconds
): string {
  return signJwt(
    toSessionClaims(user) as unknown as Record<string, unknown>,
    ttlSeconds
  );
}

/** Re-issue an existing session (used for sliding expiration). */
export function signSessionFromClaims(
  claims: SessionClaims,
  ttlSeconds: number = AUTH.sessionTtlSeconds
): string {
  return signJwt(
    {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      picture: claims.picture,
      plan: claims.plan ?? null,
      brokerAutomationEnabled: !!claims.brokerAutomationEnabled,
      csrf: claims.csrf,
      typ: "session",
      iss: AUTH.issuer,
      aud: AUTH.audience,
    },
    ttlSeconds
  );
}

/** Verify a session token without touching the database. */
export function verifySessionToken(
  token: string | null | undefined
): SessionClaims | null {
  const claims = verifyJwt<SessionClaims>(token, {
    audience: AUTH.audience,
    issuer: AUTH.issuer,
  });
  if (!claims || claims.typ !== "session" || !claims.sub) return null;
  return claims;
}

export function claimsToSession(claims: SessionClaims): Session {
  return {
    user: {
      id: claims.sub,
      name: claims.name ?? null,
      email: claims.email ?? null,
      image: claims.picture ?? null,
      plan: claims.plan ?? null,
      brokerAutomationEnabled: !!claims.brokerAutomationEnabled,
      csrf: claims.csrf,
    },
    expires: new Date(claims.exp * 1000).toISOString(),
  };
}
