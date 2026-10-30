import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { authSecret } from "./config";

/**
 * Minimal HS256 JWT implementation.
 *
 * Deliberately dependency-free: signing/verification is a single HMAC over a
 * base64url payload, which is dramatically cheaper than loading a full auth
 * framework on every request. Tokens are still standard JWT shape, so they can
 * be inspected with any JWT debugger.
 */

const HEADER = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
  "base64url"
);

function signingKey(): Buffer {
  // Hash the secret so any length works and the HMAC key is always 32 bytes.
  return createHash("sha256").update(authSecret()).digest();
}

function signature(header: string, body: string): string {
  return createHmac("sha256", signingKey())
    .update(`${header}.${body}`)
    .digest("base64url");
}

export interface JwtEnvelope {
  iat: number;
  exp: number;
  jti: string;
  aud?: string;
  iss?: string;
}

export function signJwt(
  payload: Record<string, unknown>,
  ttlSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + Math.max(1, Math.floor(ttlSeconds)),
      jti: randomUUID(),
    })
  ).toString("base64url");

  return `${HEADER}.${body}.${signature(HEADER, body)}`;
}

export interface VerifyJwtOptions {
  audience?: string;
  issuer?: string;
  clockToleranceSeconds?: number;
}

export function verifyJwt<T extends JwtEnvelope>(
  token: string | null | undefined,
  options: VerifyJwtOptions = {}
): T | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, provided] = parts;
  if (!header || !body || !provided) return null;

  let parsedHeader: { alg?: unknown; typ?: unknown } | null = null;
  try {
    parsedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (parsedHeader?.alg !== "HS256" || parsedHeader?.typ !== "JWT") return null;

  const expected = signature(header, body);
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  let payload: T;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const tolerance = options.clockToleranceSeconds ?? 30;

  if (typeof payload.exp !== "number" || payload.exp <= now - tolerance) {
    return null;
  }
  if (typeof payload.iat !== "number" || payload.iat > now + tolerance) {
    return null;
  }
  if (options.audience && payload.aud !== options.audience) return null;
  if (options.issuer && payload.iss !== options.issuer) return null;

  return payload;
}
