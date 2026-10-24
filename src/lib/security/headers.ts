/**
 * Content Security Policy for Legnoova.
 *
 * Restricts script, style, frame, connect, and image sources so that
 * XSS, clickjacking, and data exfiltration are significantly harder.
 * Inline scripts/styles are blocked unless they carry a nonce (not used
 * here; shadcn/ui styles are handled via Tailwind classes in JSX).
 */
export function buildCsp(isDev: boolean): string {
  const directives: string[] = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // Tailwind inline styles injected at runtime
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://generativelanguage.googleapis.com https://*.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com",
    "frame-ancestors 'none'", // clickjacking
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  if (isDev) {
    // Allow Vite/HMR websocket in development only.
    directives.push("connect-src 'self' ws://localhost:* http://localhost:*");
  }

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
      key: "Cross-Origin-Embedder-Policy",
      value: "require-corp",
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
