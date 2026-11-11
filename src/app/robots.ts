import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private areas stay out of the crawl. Auth pages are intentionally
        // crawlable so Google can see their noindex tag and drop them cleanly
        // instead of leaving them stuck as "Discovered - currently not indexed".
        disallow: ["/api/", "/app/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
