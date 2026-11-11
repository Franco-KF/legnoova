const fallbackSiteUrl = "https://www.legnoova.com";

// Keep one canonical host everywhere. Vercel permanently redirects the apex
// domain (legnoova.com) to www.legnoova.com, so every canonical URL, sitemap
// entry and metadata URL must use the final www host. Otherwise Google follows
// the canonical into a redirect and reports "Page with redirect".
function normalizeSiteUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === "legnoova.com") {
      parsed.hostname = "www.legnoova.com";
    }
    return parsed.origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl
);

export const siteConfig = {
  name: "Legnoova AI",
  legalName: "Legnoova",
  tagline: "A clearer way to check your forex chart and plan your next move.",
  url: siteUrl,
  description:
    "Check forex charts, follow signals and automate broker trades in one place. Choose chart analysis for $29/month or broker automation for $59/month. Trading involves risk.",
  keywords: [
    "forex chart analysis",
    "forex trading tools",
    "forex chart screenshot review",
    "structured forex signals",
    "forex signals with stop loss",
    "AI signal",
    "forex AI",
    "AI forex analysis",
    "forex chart analysis",
    "forex second opinion",
    "AI trading assistant",
    "forex market structure",
    "support and resistance AI",
    "forex entry take profit stop loss",
    "AI signal validation",
    "trade analysis tool",
    "forex trend detection",
    "AI for traders",
    "smart money concepts AI",
    "forex analysis tool",
    "signal hit rate",
    "trading journal",
  ],
  ogSiteName: "Legnoova AI — Forex Signals",
  twitter: {
    card: "summary_large_image",
    site: "@legnoova",
    creator: "@legnoova",
  },
  contactEmail: "ntwarifrank100@gmail.com",
  author: "Legnoova AI",
  inLanguage: "en",
};


