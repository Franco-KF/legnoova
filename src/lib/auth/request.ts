import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/rate-limit";

export interface RequestMeta {
  ip: string;
  userAgent: string | null;
}

export function requestMeta(req: Request): RequestMeta {
  return {
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  };
}

function allowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const configured = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];
  for (const value of configured) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      /* ignore malformed env values */
    }
  }
  return origins;
}

/**
 * Same-origin guard for state-changing requests.
 *
 * Cookies are SameSite=Lax, but that alone does not stop cross-site form
 * submissions. Comparing the Origin header against the configured app origin
 * closes that gap without needing a second CSRF cookie round-trip.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // native/non-browser clients

  const allowed = allowedOrigins();
  try {
    allowed.add(new URL(req.url).origin);
  } catch {
    /* ignore malformed request URLs */
  }
  return allowed.has(origin);
}

export function rejectCrossOrigin(req: Request): NextResponse | null {
  if (isSameOrigin(req)) return null;
  return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
}

/** Only allow internal callback paths (prevents open redirects). */
export function safeCallbackUrl(
  value: unknown,
  fallback = "/app"
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
