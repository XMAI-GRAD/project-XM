import type { MetadataRoute } from "next";
import { points } from "@/content";
import { locales } from "@/i18n/config";
import { alternates, siteUrl } from "@/i18n/server";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/about",
    "/explore",
    ...points.map((p) => `/explore/${p.slug}`),
    "/maps",
  ];
  const abs = (p: string) => `${siteUrl}${p}`;
  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: abs(`/${lang}${path}`),
      alternates: {
        languages: Object.fromEntries(
          Object.entries(alternates(path)).map(([l, p]) => [l, abs(p)]),
        ),
      },
    })),
  );
}
