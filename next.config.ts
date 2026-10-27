import type { NextConfig } from "next";
import { defaultLocale } from "./src/i18n/config";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ponytail: fixed redirect to the default locale; replaced by locale negotiation in proxy.ts
  async redirects() {
    return [
      { source: "/", destination: `/${defaultLocale}`, permanent: false },
    ];
  },
};

export default nextConfig;
