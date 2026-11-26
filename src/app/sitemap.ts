import type { MetadataRoute } from "next";
import { points } from "@/content";
import { locales } from "@/i18n/config";
import { alternates, siteUrl } from "@/i18n/server";
import { pointPath } from "@/features/explore/paths";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/about",
    "/explore/place",
    "/explore/taste",
    "/explore/craft",
    ...points.map(pointPath),
    "/maps",
    "/events",
    "/join",
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
