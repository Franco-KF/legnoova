/**
 * Content Security Policy for Legnoova.
 *
 * Restricts script, style, frame, connect, and image sources so that
 * XSS, clickjacking, and data exfiltration are significantly harder.
 * Inline scripts/styles are blocked unless they carry a nonce (not used
 * here; shadcn/ui styles are handled via Tailwind classes in JSX).
 */
export function buildCsp(isDev: boolean): string {
  const connectSources = [
    "'self'",
    "https://generativelanguage.googleapis.com",
    "https://*.googleapis.com",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    // Paddle.js and its hosted checkout/payment services.
    "https://cdn.paddle.com",
    "https://*.paddle.com",
    "https://*.paddle.io",
    "https://public.profitwell.com",
    // Loopback bridge health check. The bridge is local and read-only.
    "http://127.0.0.1:8765",
    "http://localhost:8765",
  ];
  if (isDev) {
    connectSources.push("ws://localhost:*", "http://localhost:*");
  }

  const directives: string[] = [
    "default-src 'self'",
    // Next.js streams hydration/RSC bootstrap through inline <script> tags.
    // Blocking inline scripts prevents React from hydrating, which makes the
    // whole page static (buttons/forms do nothing). 'unsafe-inline' is required
    // unless a nonce-based CSP is wired through middleware.
    "script-src 'self' 'unsafe-inline' https://cdn.paddle.com https://*.paddle.com https://*.paddle.io https://public.profitwell.com" + (isDev ? " 'unsafe-eval'" : ""),
    "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://*.paddle.com https://*.paddle.io", // Tailwind and Paddle hosted styles
    "img-src 'self' data: https:",
    "font-src 'self' https://cdn.paddle.com https://*.paddle.com https://*.paddle.io",
    "frame-src 'self' https://*.paddle.com https://*.paddle.io",
    `connect-src ${connectSources.join(" ")} https://*.paddle.com https://*.paddle.io https://public.profitwell.com`,
    "frame-ancestors 'none'", // clickjacking
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

/** Build the full security-headers object for next.config.ts headers(). */
export function securityHeaders(isDev: boolean) {
  return [
    {
      key: "Content-Security-Policy",
      value: buildCsp(isDev),
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      // Hosted payment providers must be embeddable; require-corp blocks
      // Paddle.js and its checkout frame in browsers.
      key: "Cross-Origin-Embedder-Policy",
      value: "unsafe-none",
    },
    {
      key: "X-DNS-Prefetch-Control",
      value: "off",
    },
    {
      key: "Cache-Control",
      value: "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  ];
}
