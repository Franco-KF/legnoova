/**
 * CSRF protection for cookie-authenticated API routes.
 *
 * Browsers cannot set custom headers on a cross-site request without a CORS
 * preflight, so `X-Requested-With` is the primary signal. Modern browsers also
 * send `Sec-Fetch-Site`, and same-origin requests include an `Origin` header;
 * accepting those avoids breaking clients that do not add the custom header.
 */

export const CSRF_HEADER = "x-requested-with";
export const CSRF_HEADER_VALUE = "XMLHttpRequest";

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

export function isCsrfSafeRequest(req: Request): boolean {
  if (req.headers.get(CSRF_HEADER) === CSRF_HEADER_VALUE) return true;
  if (req.headers.get("sec-fetch-site") === "same-origin") return true;

  const origin = req.headers.get("origin");
  if (!origin) return false;

  const allowed = allowedOrigins();
  try {
    allowed.add(new URL(req.url).origin);
  } catch {
    /* ignore malformed request URLs */
  }
  return allowed.has(origin);
}
