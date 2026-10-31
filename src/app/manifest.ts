import type { MetadataRoute } from "next";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Placeholder icons in public/icons/; replace with the designed ones.
export default function manifest(): MetadataRoute.Manifest {
  const { meta } = getDictionary(defaultLocale);
  return {
    name: meta.siteName,
    short_name: meta.siteName,
    description: meta.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
