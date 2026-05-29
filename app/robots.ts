import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Doublons WordPress legacy à ne pas indexer (query params dédupliqués).
      disallow: ["/*?replytocom=", "/*?print_recipe=", "/*?recipe_servings="],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
