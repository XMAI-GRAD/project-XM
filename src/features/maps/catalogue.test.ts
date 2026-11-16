import test from "node:test";
import assert from "node:assert/strict";
import {
  readSavedRoutes,
  readMapContext,
  findSavedRoute,
} from "./catalogue.ts";
import { boxesOverlap, fitsLabel, labelBox } from "./label-layout.ts";
const transform = {
  origin: { latitude: 0, longitude: 0 },
  x: [1, 0, 100],
  y: [0, -1, 1000],
};
const artwork = { width: 2000, height: 2000 };
const endpoints = [
  { latitude: 0, longitude: 0 },
  { latitude: 0.001, longitude: 0.001 },
];
const points = endpoints.map((mapLocation, i) => ({
  slug: i ? "b" : "a",
  mapLocation,
}));
const makeRoute = () => ({
  id: "test",
  from: "a",
  to: "b",
  mode: "walking",
  review: "geometry-checked",
  provider: "FOSSGIS OSRM",
  sourceSha256: "a".repeat(64),
  sourceUrl: "https://example.org/route",
  savedOn: "2026-11-09",
  reviewedOn: "2026-11-16",
  endpoints,
  distanceMeters: 160,
  durationSeconds: 120,
  geometry: {
    type: "LineString",
    coordinates: [
      [0, 0],
      [0.001, 0.001],
    ],
  },
});
const read = (routes: unknown[]) =>
  readSavedRoutes({ version: 1, routes }, points, transform, artwork);
test("only an exact saved direction resolves, with no stale route for partial/same/reverse pairs", () => {
  const routes = read([makeRoute()]);
  assert.equal(findSavedRoute(routes, "a", "b")?.id, "test");
  for (const pair of [
    ["b", "a"],
    ["a", "a"],
    ["", "b"],
    ["a", "unknown"],
  ])
    assert.equal(
      findSavedRoute(routes, ...(pair as [string, string])),
      undefined,
    );
  assert.equal(routes[0].pixels.length, 2);
});
test("rejects routes after a canonical location changes, unknown places or duplicate pairs", () => {
  assert.throws(
    () =>
      readSavedRoutes(
        { version: 1, routes: [makeRoute()] },
        [
          { slug: "a", mapLocation: { latitude: 0.01, longitude: 0 } },
          points[1],
        ],
        transform,
        artwork,
      ),
    /Stale/,
  );
  assert.throws(() => read([{ ...makeRoute(), to: "unknown" }]), /unknown/);
  assert.throws(
    () => read([makeRoute(), { ...makeRoute(), id: "other" }]),
    /Duplicate/,
  );
});
test("rejects excessive endpoint snapping, out-of-artwork paths and bad source metadata", () => {
  assert.throws(
    () =>
      read([
        {
          ...makeRoute(),
          geometry: {
            type: "LineString",
            coordinates: [
              [0.0005, 0],
              [0.001, 0.001],
            ],
          },
        },
      ]),
    /gap/,
  );
  assert.throws(
    () =>
      read([
        {
          ...makeRoute(),
          geometry: {
            type: "LineString",
            coordinates: [
              [0, 0],
              [0.1, 0],
              [0.001, 0.001],
            ],
          },
        },
      ]),
    /artwork/,
  );
  for (const patch of [
    { sourceUrl: "javascript:alert(1)" },
    { distanceMeters: NaN },
    { savedOn: "2026-02-31" },
    { reviewedOn: "2026-01-01" },
    { sourceSha256: "missing" },
  ])
    assert.throws(() => read([{ ...makeRoute(), ...patch }]));
});
test("context labels require source references, geographic anchors and road tangents", () => {
  const label = {
    id: "road",
    kind: "road",
    name: { vi: "Đường", en: "Street" },
    priority: 0,
    sourceRefs: [{ tile: "14-1-1", layer: "transportation_name", index: 0 }],
    anchors: [
      {
        coordinates: [0.001, 0.001],
        tangent: [
          [0, 0],
          [0.001, 0.001],
        ],
      },
    ],
  };
  const readLabels = (labels: unknown[]) =>
    readMapContext(
      {
        version: 1,
        sourceUrl: "https://openfreemap.org/",
        snapshot: "snapshot",
        labels,
      },
      transform,
      artwork,
    );
  assert.equal(readLabels([label])[0].anchors.length, 1);
  assert.throws(() =>
    readLabels([{ ...label, anchors: [{ coordinates: [21, 105] }] }]),
  );
  assert.throws(() => readLabels([{ ...label, sourceRefs: [] }]));
  assert.throws(() => readLabels([label, label]), /duplicate/);
});
test("rotated label bounds reject viewport clipping and pin/card collisions", () => {
  const rotated = labelBox(100, 100, 120, 20, 90);
  assert.ok(rotated.bottom - rotated.top > rotated.right - rotated.left);
  assert.equal(fitsLabel(rotated, { x: 300, y: 300 }, []), true);
  assert.equal(
    fitsLabel(rotated, { x: 300, y: 300 }, [
      { left: 90, top: 80, right: 120, bottom: 120 },
    ]),
    false,
  );
  assert.equal(
    fitsLabel(labelBox(0, 0, 100, 20, 0), { x: 300, y: 300 }, []),
    false,
  );
  assert.equal(boxesOverlap(rotated, labelBox(250, 250, 40, 20, 0)), false);
});
