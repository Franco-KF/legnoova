import { NextResponse } from "next/server";
import { AUTH, oauthCookieOptions } from "@/lib/auth/config";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  googleConfigured,
  googleRedirectUri,
} from "@/lib/auth/oauth";
import { safeCallbackUrl } from "@/lib/auth/request";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const callbackUrl = safeCallbackUrl(requestUrl.searchParams.get("callbackUrl"));

  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=Configuration", req.url)
    );
  }

  const redirectUri = googleRedirectUri(req);
  const { state, verifier, cookie } = createOAuthState(callbackUrl);
  const location = buildGoogleAuthUrl({ redirectUri, state, verifier });

  const response = NextResponse.redirect(location);
  response.cookies.set(AUTH.oauthCookieName, cookie, oauthCookieOptions());
  return response;
}
