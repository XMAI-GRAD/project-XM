// Offline, explicit promotion. Frozen endpoint coordinates detect stale routes.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { stringify } from "yaml";
import { format } from "prettier";
const routes = ["central", "lake", "outer", "bridge"].map((id) => {
  const bytes = fs.readFileSync(
    new URL(`./samples/${id}.json`, import.meta.url),
  );
  const sample = JSON.parse(bytes);
  const route = sample.response.routes[0];
  return {
    id,
    from: sample.endpoints[0].slug,
    to: sample.endpoints[1].slug,
    mode: "walking",
    savedOn: sample.fetchedAt.slice(0, 10),
    reviewedOn: "2026-11-16",
    review: "geometry-checked",
    provider: sample.provider,
    sourceUrl: sample.requestUrl,
    sourceSha256: createHash("sha256").update(bytes).digest("hex"),
    endpoints: sample.endpoints.map(({ latitude, longitude }) => ({
      latitude,
      longitude,
    })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
});
const proof = JSON.parse(
  fs.readFileSync(new URL("../map-labels/review-data.json", import.meta.url)),
);
const labels = proof.features
  .filter((f) => f.kind !== "entrance")
  .map((f, i) => ({
    id: f.id,
    kind: f.kind,
    name: { vi: f.name, en: f.name },
    priority: i,
    anchors: (f.candidates ?? [f]).map((c) => ({
      coordinates: c.coordinates,
      ...(c.tangent ? { tangent: c.tangent } : {}),
    })),
    sourceRefs: f.sourceRefs,
  }));
for (const [file, data] of [
  ["map-routes.yaml", { version: 1, routes }],
  [
    "map-context.yaml",
    {
      version: 1,
      sourceUrl: "https://openfreemap.org/",
      snapshot: "20261101_080013_pt",
      labels,
    },
  ],
]) {
  fs.writeFileSync(
    new URL(`../../data/${file}`, import.meta.url),
    await format(stringify(data, { lineWidth: 0 }), { parser: "yaml" }),
  );
}
console.log(
  `Promoted ${routes.length} saved paths and ${labels.length} geographic labels`,
);
