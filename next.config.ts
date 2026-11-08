import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Images are served from the CDN; the content check that reads public/ only runs at build.
  outputFileTracingExcludes: { "/**": ["./public/**/*"] },
  images: {
    // Google profile photos.
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  turbopack: {
    rules: {
      // src/content imports data/*.yaml with `?raw` as plain text (import.meta.glob).
      "*.yaml": { condition: { query: "?raw" }, type: "text" },
      "*.css": {
        // `as: "*.css"` would turn CSS Modules into global CSS, so leave them out.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
