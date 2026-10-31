import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
const paths = ["", "/features", "/pricing", "/how-it-works", "/privacy", "/terms", "/fallback/refunds"];
export default function sitemap(): MetadataRoute.Sitemap { return paths.map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : 0.7 })); }
