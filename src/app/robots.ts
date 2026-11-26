import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { siteUrl } from "@/i18n/server";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/auth/", ...locales.map((l) => `/${l}/account`)],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
