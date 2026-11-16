// Explicit research acquisition only; never called by the app or preview.
import fs from "node:fs";
import { createHash } from "node:crypto";
const root = new URL("./source-tiles/", import.meta.url);
if (fs.existsSync(new URL("manifest.json", root)))
  throw new Error(
    "Archive the existing snapshot deliberately before refreshing",
  );
const metadataUrl = "https://tiles.openfreemap.org/planet";
const bbox = [105.8305, 21.0245, 105.8445, 21.0375];
async function read(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "project-XM-map-label-research/1.0" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Reference HTTP ${response.status}`);
  return response;
}
const metadata = await (await read(metadataUrl)).json();
const z = 14,
  n = 2 ** z;
const tileX = (lon) => Math.floor(((lon + 180) / 360) * n);
const tileY = (lat) =>
  Math.floor(
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n,
  );
const tiles = [];
fs.mkdirSync(root, { recursive: true });
for (let x = tileX(bbox[0]); x <= tileX(bbox[2]); x++) {
  for (let y = tileY(bbox[3]); y <= tileY(bbox[1]); y++) {
    const url = metadata.tiles[0]
      .replace("{z}", z)
      .replace("{x}", x)
      .replace("{y}", y);
    const bytes = Buffer.from(await (await read(url)).arrayBuffer());
    const key = `${z}-${x}-${y}`;
    fs.writeFileSync(new URL(`${key}.pbf`, root), bytes);
    tiles.push({
      key,
      url,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
}
const manifest = {
  fetchedAt: new Date().toISOString(),
  metadataUrl,
  bbox,
  metadata,
  tiles,
  source:
    "OpenStreetMap-derived OpenMapTiles vector data hosted by OpenFreeMap",
  attribution:
    "OpenFreeMap · © OpenMapTiles · Data from © OpenStreetMap contributors (ODbL)",
  note: "Tile feature identifiers are NOT asserted to be OSM object IDs. Geometry is clipped/quantized by the vector-tile pipeline.",
};
fs.writeFileSync(
  new URL("manifest.json", root),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    tiles: tiles.length,
    bytes: tiles.reduce((sum, t) => sum + t.bytes, 0),
  }),
);
