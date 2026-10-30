import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { AUTH, appUrl } from "./config";
import { signJwt, verifyJwt } from "./jwt";
import type { OAuthClaims } from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function googleRedirectUri(req: Request): string {
  const base = appUrl() || new URL(req.url).origin;
  return `${base.replace(/\/+$/, "")}/api/auth/callback/google`;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface OAuthState {
  state: string;
  verifier: string;
  cookie: string;
}

export function createOAuthState(callbackUrl: string): OAuthState {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const cookie = signJwt(
    {
      state,
      verifier,
      cb: callbackUrl,
      typ: "oauth",
      iss: AUTH.issuer,
      aud: AUTH.audience,
    },
    10 * 60
  );
  return { state, verifier, cookie };
}

export function verifyOAuthState(
  cookie: string | undefined,
  state: string
): { verifier: string; callbackUrl: string } | null {
  const claims = verifyJwt<OAuthClaims>(cookie, {
    audience: AUTH.audience,
    issuer: AUTH.issuer,
  });
  if (!claims || claims.typ !== "oauth") return null;
  if (!safeEqual(claims.state, state)) return null;
  return { verifier: claims.verifier, callbackUrl: claims.cb };
}

export function buildGoogleAuthUrl(input: {
  redirectUri: string;
  state: string;
  verifier: string;
}): string {
  const challenge = createHash("sha256")
    .update(input.verifier)
    .digest("base64url");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("Malformed ID token");
  return JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8")
  ) as Record<string, unknown>;
}

export async function exchangeGoogleCode(input: {
  code: string;
  redirectUri: string;
  verifier: string;
}): Promise<GoogleIdentity> {
  const body = new URLSearchParams({
    code: input.code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
    code_verifier: input.verifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status})`);
  }

  const data = (await response.json()) as {
    id_token?: string;
    access_token?: string;
  };

  let payload: Record<string, unknown>;
  if (data.id_token) {
    payload = decodeJwtPayload(data.id_token);
  } else if (data.access_token) {
    const userinfo = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${data.access_token}` },
      cache: "no-store",
    });
    if (!userinfo.ok) {
      throw new Error(`Google userinfo failed (${userinfo.status})`);
    }
    payload = (await userinfo.json()) as Record<string, unknown>;
  } else {
    throw new Error("Google response did not include a token");
  }

  const issuer = payload.iss;
  if (
    issuer &&
    issuer !== "https://accounts.google.com" &&
    issuer !== "accounts.google.com"
  ) {
    throw new Error("Unexpected Google token issuer");
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const audience = payload.aud;
  const audienceMatches =
    audience === clientId ||
    (Array.isArray(audience) && audience.includes(clientId));
  if (audience && !audienceMatches) {
    throw new Error("Unexpected Google token audience");
  }
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    throw new Error("Google token has expired");
  }

  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Google account is missing an id or email");
  }

  return {
    sub,
    email: email.toLowerCase(),
    emailVerified:
      payload.email_verified === true || payload.email_verified === "true",
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
