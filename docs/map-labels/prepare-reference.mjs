// Offline extraction from the two archived PBFs; no application dependencies added.
// node docs/map-labels/prepare-reference.mjs <external-decoder-tools-directory>
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { format } from "prettier";
import { clipLine } from "./reference-geometry.mjs";
if (!process.argv[2])
  throw new Error("Supply the external decoder-tools directory");
const require = createRequire(resolve(process.argv[2], "package.json"));
const { VectorTile } = require("@mapbox/vector-tile");
const { PbfReader } = require("pbf");
const root = new URL("./source-tiles/", import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL("manifest.json", root)));
const names = [
  "Đường Hoàng Diệu",
  "Phố Nguyễn Thái Học",
  "Phố Văn Miếu",
  "Phố Quốc Tử Giám",
  "Đường Điện Biên Phủ",
  "Phố Chu Văn An",
  "Phố Trần Phú",
  "Phố Tôn Đức Thắng",
  "Đường Nguyễn Tri Phương",
];
const wantedPoi = new Map([
  ["Đoan Môn", "attraction"],
  ["Công viên Lê-nin", "park"],
  ["Hoàng thành Thăng Long", "castle"],
]);
const roads = names.map((name, i) => ({
  id: `road-${i}`,
  kind: "road",
  name,
  lines: [],
  sourceRefs: [],
}));
const background = [],
  landmarks = [],
  seen = new Set();
for (const source of manifest.tiles) {
  const bytes = fs.readFileSync(new URL(`${source.key}.pbf`, root));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    source.sha256,
    "Raw tile hash mismatch",
  );
  const [z, x, y] = source.key.split("-").map(Number);
  const tile = new VectorTile(new PbfReader(bytes));
  for (const layerName of ["transportation", "transportation_name", "poi"]) {
    const layer = tile.layers[layerName];
    if (!layer) continue;
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i).toGeoJSON(x, y, z);
      const ref = { tile: source.key, layer: layerName, index: i };
      const name = f.properties.name;
      if (layerName === "poi") {
        if (
          f.geometry.type !== "Point" ||
          wantedPoi.get(name) !== f.properties.class
        )
          continue;
        if (landmarks.some((p) => p.name === name)) continue;
        landmarks.push({
          id: `landmark-${landmarks.length}`,
          kind: "landmark",
          name,
          coordinates: f.geometry.coordinates,
          sourceRefs: [ref],
          sourceClass: f.properties.class,
        });
        continue;
      }
      const road = roads.find((r) => r.name === name);
      if (layerName === "transportation_name" && !road) continue;
      const lines =
        f.geometry.type === "LineString"
          ? [f.geometry.coordinates]
          : f.geometry.type === "MultiLineString"
            ? f.geometry.coordinates
            : [];
      const clipped = lines.flatMap((line) => clipLine(line, manifest.bbox));
      if (layerName === "transportation_name") {
        if (clipped.length) road.sourceRefs.push(ref);
        for (const line of clipped) {
          const key = name + JSON.stringify(line);
          if (!seen.has(key)) {
            seen.add(key);
            road.lines.push(line);
          }
        }
      } else {
        for (const line of clipped) {
          const key = "background" + JSON.stringify(line);
          if (!seen.has(key)) {
            seen.add(key);
            background.push({
              coordinates: line,
              class: f.properties.class,
              source: ref,
            });
          }
        }
      }
    }
  }
}
assert.equal(landmarks.length, wantedPoi.size);
for (const road of roads)
  assert.ok(road.lines.length, `Missing source geometry: ${road.name}`);
const reference = {
  fetchedAt: manifest.fetchedAt,
  bbox: manifest.bbox,
  source: manifest.source,
  attribution: manifest.attribution,
  note:
    manifest.note +
    " Derived lines are clipped to the review bounds; names are copied verbatim. No alignment offsets were applied.",
  tiles: manifest.tiles,
  roads,
  landmarks,
  background,
};
fs.writeFileSync(
  new URL("./reference.json", import.meta.url),
  await format(JSON.stringify(reference), { parser: "json" }),
);
console.log(
  JSON.stringify({
    roads: roads.length,
    landmarks: landmarks.length,
    backgroundSegments: background.length,
  }),
);
