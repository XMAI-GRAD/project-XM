// Offline build using the app's existing, validated calibration and locations.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { format } from "prettier";
import { loadContent } from "../map-calibration/load-content.mjs";
import { projectToArtwork } from "../../src/features/maps/georeference.ts";
const { getPoint, getPage, mapTransform } = await loadContent();
const artwork = getPage("maps").artwork;
const reference = JSON.parse(
  fs.readFileSync(new URL("./reference.json", import.meta.url)),
);
const rawRoute = fs.readFileSync(
  new URL("../map-routing/samples/central.json", import.meta.url),
);
const sample = JSON.parse(rawRoute);
const project = ([longitude, latitude]) =>
  projectToArtwork({ longitude, latitude }, mapTransform);
const projectLine = (line) => line.map(project);
const length = (line) =>
  line
    .slice(1)
    .reduce(
      (sum, p, i) => sum + Math.hypot(p.x - line[i].x, p.y - line[i].y),
      0,
    );
const roads = reference.roads.map((r) => {
  const pixels = r.lines.map(projectLine);
  // Candidate label anchors stay on the longest contiguous source line.
  const index = pixels
    .map(length)
    .reduce((best, n, i, all) => (n > all[best] ? i : best), 0);
  const path = pixels[index];
  const candidates = [0.5, 0.25, 0.75, 0.125, 0.875].map((fraction) => {
    let remaining = length(path) * fraction,
      anchor,
      tangent;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1],
        b = path[i],
        distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (remaining <= distance && distance > 0) {
        const t = remaining / distance,
          ga = r.lines[index][i - 1],
          gb = r.lines[index][i];
        anchor = [ga[0] + (gb[0] - ga[0]) * t, ga[1] + (gb[1] - ga[1]) * t];
        tangent = [ga, gb];
        break;
      }
      remaining -= distance;
    }
    assert.ok(anchor, `Cannot anchor ${r.name}`);
    return { coordinates: anchor, pixel: project(anchor), tangent };
  });
  return { ...r, pixels, ...candidates[0], candidates };
});
const landmarks = reference.landmarks.map((p) => ({
  ...p,
  pixel: project(p.coordinates),
}));
const entrances = sample.endpoints.map((e, i) => {
  const p = getPoint(e.slug);
  assert.equal(p.mapLocation.latitude, e.latitude);
  assert.equal(p.mapLocation.longitude, e.longitude);
  const coordinates = [e.longitude, e.latitude];
  return {
    id: `entrance-${i}`,
    kind: "entrance",
    name: p.name.vi,
    coordinates,
    pixel: project(coordinates),
    source: p.mapLocation.source,
    description: p.mapLocation.label.en,
    badge: i === 0 ? "A" : "B",
  };
});
const route = sample.response.routes[0];
assert.equal(sample.response.code, "Ok");
const data = {
  artwork,
  transform: mapTransform,
  bbox: reference.bbox,
  source: {
    name: reference.source,
    fetchedAt: reference.fetchedAt,
    tiles: reference.tiles,
  },
  features: [...roads, ...landmarks, ...entrances],
  background: reference.background.map((r) => ({
    ...r,
    pixels: projectLine(r.coordinates),
  })),
  route: {
    coordinates: route.geometry.coordinates,
    pixels: projectLine(route.geometry.coordinates),
    distance: route.distance,
    duration: route.duration,
    sha256: createHash("sha256").update(rawRoute).digest("hex"),
  },
};
fs.writeFileSync(
  new URL("./review-data.json", import.meta.url),
  await format(JSON.stringify(data), { parser: "json" }),
);
console.log(
  JSON.stringify({
    roads: roads.length,
    landmarks: landmarks.length,
    entrances: entrances.length,
    routeVertices: data.route.pixels.length,
    backgroundSegments: data.background.length,
  }),
);
