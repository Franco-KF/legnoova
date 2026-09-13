import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

const routes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: string;
}> = [
  { path: "", priority: 1, changeFrequency: "weekly", lastModified: "2026-09-13" },
  { path: "/features", priority: 0.9, changeFrequency: "monthly", lastModified: "2026-09-13" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly", lastModified: "2026-09-13" },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly", lastModified: "2026-09-13" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-01-15" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly", lastModified: "2026-01-15" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}