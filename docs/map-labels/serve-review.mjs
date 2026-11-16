// Loopback-only, explicit asset allowlist. No filesystem browsing or proxying.
import fs from "node:fs";
import http from "node:http";
const files = new Map([
  ["/", ["review.html", "text/html"]],
  ...[
    "review.html",
    "review.js",
    "review.css",
    "review-data.json",
    "reference.json",
    "README.md",
    "source-tiles/manifest.json",
  ].map((name) => [
    "/" + name,
    [
      name,
      name.endsWith(".json")
        ? "application/json"
        : name.endsWith(".js")
          ? "text/javascript"
          : name.endsWith(".css")
            ? "text/css"
            : name.endsWith(".html")
              ? "text/html"
              : "text/plain",
    ],
  ]),
  [
    "/leaflet.js",
    ["../../node_modules/leaflet/dist/leaflet.js", "text/javascript"],
  ],
  ["/leaflet.css", ["../../node_modules/leaflet/dist/leaflet.css", "text/css"]],
  ["/hanoi-map.png", ["../../public/maps/hanoi-map.png", "image/png"]],
  ...["14-13008-7212", "14-13009-7212"].map((key) => [
    `/source-tiles/${key}.pbf`,
    [`source-tiles/${key}.pbf`, "application/octet-stream"],
  ]),
]);
http
  .createServer((req, res) => {
    const asset = files.get(new URL(req.url, "http://localhost").pathname);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    if (!asset) {
      res.writeHead(404).end("Not found");
      return;
    }
    try {
      const body = fs.readFileSync(new URL(asset[0], import.meta.url));
      res.writeHead(200, {
        "Content-Type":
          asset[1] + (asset[1].startsWith("text/") ? "; charset=utf-8" : ""),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(500).end("Review asset unavailable; rebuild the review");
    }
  })
  .listen(4319, "127.0.0.1", () =>
    console.log("Map source proof: http://127.0.0.1:4319"),
  );
