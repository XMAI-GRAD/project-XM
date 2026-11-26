// Offline build; reuses saved routes and the app's validated content/calibration.
// node --conditions=react-server --experimental-strip-types docs/map-routing/build-review.mjs
import fs from "node:fs";
import { createHash } from "node:crypto";
import { format } from "prettier";
import { loadContent } from "../map-calibration/load-content.mjs";
import { projectRouteGeometry } from "../../src/features/maps/route-geometry.ts";
import { projectToArtwork } from "../../src/features/maps/georeference.ts";

const { getPoint, getPage, mapTransform, mapCalibration } = await loadContent();
const artwork = getPage("maps").artwork;
const samples = ["central", "lake", "outer", "bridge"].map((id) => {
  const path = new URL(`./samples/${id}.json`, import.meta.url);
  const raw = fs.readFileSync(path);
  const sample = JSON.parse(raw);
  for (const endpoint of sample.endpoints) {
    const canonical = getPoint(endpoint.slug);
    if (
      !canonical?.mapLocation ||
      canonical.mapLocation.latitude !== endpoint.latitude ||
      canonical.mapLocation.longitude !== endpoint.longitude
    ) {
      throw new Error(
        `The ${id} endpoint changed; review the saved route before rebuilding`,
      );
    }
  }
  const route = sample.response.routes[0];
  if (
    sample.response.code !== "Ok" ||
    route.distance <= 0 ||
    route.duration <= 0
  )
    throw new Error(`Invalid saved route ${id}`);
  const projection = projectRouteGeometry(
    route.geometry,
    mapTransform,
    artwork,
    sample.endpoints,
  );
  return {
    id,
    fetchedAt: sample.fetchedAt,
    sourceSha256: createHash("sha256").update(raw).digest("hex"),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    endpoints: sample.endpoints.map((endpoint) => ({
      ...endpoint,
      pixel: projectToArtwork(endpoint, mapTransform),
    })),
    ...projection,
  };
});
const report = {
  reviewedOn: "2026-11-09",
  provider: "FOSSGIS OSRM",
  mode: "walking",
  artwork: mapCalibration.artwork,
  samples: samples.map(({ pixels, leaflet, ...sample }) => ({
    ...sample,
    vertices: pixels.length,
    leafletVertices: leaflet.length,
  })),
};
fs.writeFileSync(
  new URL("./measurements.json", import.meta.url),
  await format(JSON.stringify(report), { parser: "json" }),
);
const template = fs.readFileSync(
  new URL("./review.template.html", import.meta.url),
  "utf8",
);
const payload = JSON.stringify({ artwork, samples }).replaceAll("<", "\\u003c");
fs.writeFileSync(
  new URL("./review.html", import.meta.url),
  await format(template.replace("__REVIEW_DATA__", payload), {
    parser: "html",
  }),
);
console.log(JSON.stringify(report, null, 2));
