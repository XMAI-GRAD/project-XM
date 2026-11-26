// Explicit, one-sample research fetch. No service is called by the app or review.
// node --conditions=react-server --experimental-strip-types docs/map-routing/fetch-sample.mjs central
import fs from "node:fs";
import { loadContent } from "../map-calibration/load-content.mjs";
import { projectRouteGeometry } from "../../src/features/maps/route-geometry.ts";

const samples = {
  central: ["hoang-thanh-thang-long", "van-mieu-quoc-tu-giam"],
  lake: ["bun-thang-ba-duc", "ho-hoan-kiem-den-ngoc-son"],
  outer: ["van-mieu-quoc-tu-giam", "van-phuc"],
  bridge: ["pho-co-36-pho-phuong", "cau-long-bien"],
};
const id = process.argv[2];
if (!Object.hasOwn(samples, id))
  throw new Error("Choose central, lake, outer or bridge");
const out = new URL(`./samples/${id}.json`, import.meta.url);
if (fs.existsSync(out))
  throw new Error(
    "Saved sample already exists; inspect and explicitly archive it before refreshing",
  );
const { getPoint, mapTransform, getPage } = await loadContent();
const endpoints = samples[id].map((slug) => {
  const point = getPoint(slug);
  if (!point?.mapLocation) throw new Error("Missing sourced endpoint");
  return { slug, code: point.code, name: point.name.vi, ...point.mapLocation };
});
const base = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/";
const url = new URL(
  base + endpoints.map((p) => `${p.longitude},${p.latitude}`).join(";"),
);
url.search = new URLSearchParams({
  overview: "full",
  geometries: "geojson",
  steps: "false",
  alternatives: "false",
  radiuses: "100;100",
  generate_hints: "false",
}).toString();
// Minimum spacing shared by local invocations; not a distributed production limiter.
const stamp = new URL("./.last-request", import.meta.url);
if (fs.existsSync(stamp) && Date.now() - fs.statSync(stamp).mtimeMs < 1200)
  throw new Error("Wait at least 1.2 seconds between sample requests");
fs.writeFileSync(stamp, "");
const response = await fetch(url, {
  headers: {
    "User-Agent":
      "project-XM-artwork-routing-research/1.0 (+https://github.com/XMAI-GRAD/project-XM)",
    Accept: "application/json",
  },
  signal: AbortSignal.timeout(30000),
});
if (!response.ok)
  throw new Error(
    `Route request failed: HTTP ${response.status}; no automatic retry`,
  );
const body = await response.json();
const route = body.routes?.[0];
if (
  body.code !== "Ok" ||
  !route ||
  !Number.isFinite(route.distance) ||
  route.distance <= 0 ||
  !Number.isFinite(route.duration) ||
  route.duration <= 0
)
  throw new Error(`Invalid route response: ${body.code}`);
const projected = projectRouteGeometry(
  route.geometry,
  mapTransform,
  getPage("maps").artwork,
  endpoints,
);
fs.mkdirSync(new URL("./samples/", import.meta.url), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      id,
      fetchedAt: new Date().toISOString(),
      provider: "FOSSGIS OSRM",
      mode: "walking",
      requestUrl: url.href,
      policyUrl: "https://routing.openstreetmap.de/about.html",
      attribution:
        "Routing: OSRM / FOSSGIS; map data © OpenStreetMap contributors (ODbL)",
      endpoints,
      response: body,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    id,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    vertices: projected.pixels.length,
    outsideVertexCount: projected.outsideVertexCount,
    endpointGapsMeters: projected.endpointGapsMeters,
  }),
);
