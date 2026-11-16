// Only the explicitly listed review assets are served, on the loopback interface.
import http from "node:http";
import fs from "node:fs";
const files = new Map([
  ["/", ["./review.html", "text/html"]],
  ["/review.html", ["./review.html", "text/html"]],
  ["/review.js", ["./review.js", "text/javascript"]],
  ["/review.css", ["./review.css", "text/css"]],
  ["/measurements.json", ["./measurements.json", "application/json"]],
  [
    "/node_modules/leaflet/dist/leaflet.js",
    ["../../node_modules/leaflet/dist/leaflet.js", "text/javascript"],
  ],
  [
    "/node_modules/leaflet/dist/leaflet.css",
    ["../../node_modules/leaflet/dist/leaflet.css", "text/css"],
  ],
  [
    "/public/maps/hanoi-map.png",
    ["../../public/maps/hanoi-map.png", "image/png"],
  ],
  [
    "/research/map-routing/README.md",
    ["../../research/map-routing/README.md", "text/plain; charset=utf-8"],
  ],
  ...["central", "lake", "outer", "bridge"].map((id) => [
    `/samples/${id}.json`,
    [`./samples/${id}.json`, "application/json"],
  ]),
]);
const server = http.createServer((req, res) => {
  const file = files.get(new URL(req.url, "http://localhost").pathname);
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  if (!file) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  try {
    const bytes = fs.readFileSync(new URL(file[0], import.meta.url));
    res.writeHead(200, {
      "Content-Type": file[1],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(500);
    res.end("Review asset unavailable; rebuild the review.");
  }
});
server.listen(4318, "127.0.0.1", () =>
  console.log("Route review: http://127.0.0.1:4318"),
);
