import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH, oauthCookieOptions } from "@/lib/auth/config";
import { applySessionCookie } from "@/lib/auth/session";
import {
  exchangeGoogleCode,
  googleRedirectUri,
  verifyOAuthState,
} from "@/lib/auth/oauth";
import { requestMeta } from "@/lib/auth/request";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Account } from "@/models/Account";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

function failure(req: Request, code: string) {
  const response = NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(code)}`, req.url)
  );
  response.cookies.set(AUTH.oauthCookieName, "", {
    ...oauthCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (oauthError) return failure(req, "AccessDenied");
  if (!code || !state) return failure(req, "OAuthCallbackError");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(AUTH.oauthCookieName)?.value;
  const verified = verifyOAuthState(stateCookie, state);
  if (!verified) return failure(req, "OAuthCallbackError");

  try {
    const identity = await exchangeGoogleCode({
      code,
      redirectUri: googleRedirectUri(req),
      verifier: verified.verifier,
    });

    if (!identity.emailVerified) {
      return failure(req, "AccessDenied");
    }

    await dbConnect();

    // Prefer an already-linked Google account. This keeps a user signed in even
    // if their email address changed on either side.
    const linked = await Account.findOne({
      provider: "google",
      providerAccountId: identity.sub,
    });
    let user = linked ? await User.findById(linked.userId) : null;

    if (!user) {
      const byEmail = await User.findOne({ email: identity.email }).select(
        "+passwordHash"
      );

      // Refuse to silently attach Google to an existing password account.
      // Otherwise someone could pre-register a victim's email and later access
      // the account once the victim signs in with Google.
      if (byEmail?.passwordHash) {
        return failure(req, "OAuthAccountNotLinked");
      }

      user = byEmail;
    }

    if (!user) {
      user = await User.create({
        name: identity.name || identity.email.split("@")[0],
        email: identity.email,
        image: identity.picture,
        emailVerified: new Date(),
      });
    } else {
      let changed = false;
      if (!user.image && identity.picture) {
        user.image = identity.picture;
        changed = true;
      }
      if (!user.emailVerified) {
        user.emailVerified = new Date();
        changed = true;
      }
      if (changed) await user.save();
    }

    await Account.updateOne(
      { provider: "google", providerAccountId: identity.sub },
      {
        $setOnInsert: {
          userId: user._id,
          type: "oauth",
          provider: "google",
          providerAccountId: identity.sub,
        },
      },
      { upsert: true }
    );

    const sessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image ?? null,
      plan: user.plan ?? null,
      brokerAutomationEnabled: !!user.brokerAutomationEnabled,
    };

    const { ip, userAgent } = requestMeta(req);
    try {
      await recordSecurityEvent({
        type: "login_success",
        userId: sessionUser.id,
        ip,
        userAgent,
        details: { provider: "google" },
        severity: "low",
      });
    } catch {
      /* non-critical */
    }

    const response = NextResponse.redirect(
      new URL(verified.callbackUrl, req.url)
    );
    applySessionCookie(response, sessionUser);
    response.cookies.set(AUTH.oauthCookieName, "", {
      ...oauthCookieOptions(0),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return failure(req, "OAuthCallbackError");
  }
}
