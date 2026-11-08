import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/config/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
    return Object.values(TOOLS).map(page => ({ url: SITE_URL + page.path }));
}
