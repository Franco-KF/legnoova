import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// Only include public, indexable pages. lastModified must be the date the page
// content actually changed, not the time this file is requested; a lastmod that
// changes on every crawl is ignored by Google.
const routes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: string;
}> = [
  { path: "", priority: 1, changeFrequency: "weekly", lastModified: "2026-11-11" },
  { path: "/features", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-11-11" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-11-11" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-11-11" },
  { path: "/forex-chart-analysis", priority: 0.9, changeFrequency: "monthly", lastModified: "2026-11-11" },
  { path: "/forex-automation", priority: 0.9, changeFrequency: "monthly", lastModified: "2026-11-11" },
  { path: "/forex-trading-bot", priority: 0.9, changeFrequency: "monthly", lastModified: "2026-11-11" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly", lastModified: "2026-01-15" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly", lastModified: "2026-01-15" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
