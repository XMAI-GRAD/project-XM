import assert from "node:assert/strict";
import { test } from "node:test";
import { fitArtworkTransform } from "./georeference.ts";
import {
  endpointDistanceMeters,
  projectRouteGeometry,
  readRouteLineString,
} from "./route-geometry.ts";

const origin = { latitude: 21, longitude: 105.8 };
const controls = [
  { latitude: 21, longitude: 105.8, x: 100, y: 200 },
  { latitude: 21, longitude: 105.81, x: 200, y: 200 },
  { latitude: 21.01, longitude: 105.8, x: 100, y: 100 },
].map(({ latitude, longitude, x, y }, i) => ({
  id: String(i),
  name: "test",
  source: "test",
  coordinates: { latitude, longitude },
  image: { x, y },
}));
const transform = fitArtworkTransform(origin, controls);
const geometry = {
  type: "LineString",
  coordinates: [
    [105.8, 21],
    [105.81, 21],
  ],
};

test("route GeoJSON is longitude first; altitude is ignored and invalid input is rejected", () => {
  assert.deepEqual(readRouteLineString(geometry)[0], origin);
  assert.deepEqual(
    readRouteLineString({
      ...geometry,
      coordinates: [
        [105.8, 21, 12],
        [105.81, 21, 14],
      ],
    })[0],
    origin,
  );
  for (const bad of [
    null,
    { type: "Point", coordinates: [105.8, 21] },
    { ...geometry, coordinates: [[105.8, 21]] },
    {
      ...geometry,
      coordinates: [
        [21, 105.8],
        [21, 105.81],
      ],
    },
    {
      ...geometry,
      coordinates: [
        ["105.8", 21],
        [105.81, 21],
      ],
    },
    {
      ...geometry,
      coordinates: [
        [105.8, NaN],
        [105.81, 21],
      ],
    },
    {
      ...geometry,
      coordinates: [
        [105.8, 21, Infinity],
        [105.81, 21],
      ],
    },
    {
      ...geometry,
      coordinates: Array.from({ length: 20001 }, () => [105.8, 21]),
    },
  ])
    assert.throws(() => readRouteLineString(bad));
});

test("route projection matches the existing top-left image and Leaflet bottom-left axes", () => {
  const result = projectRouteGeometry(
    geometry,
    transform,
    { width: 300, height: 1020 },
    [origin, { latitude: 21, longitude: 105.81 }],
  );
  assert.ok(Math.abs(result.pixels[0].x - 100) < 1e-6);
  assert.ok(Math.abs(result.pixels[0].y - 200) < 1e-6);
  assert.ok(Math.abs(result.leaflet[1][0] - 820) < 1e-6);
  assert.ok(Math.abs(result.leaflet[1][1] - 200) < 1e-6);
  assert.equal(result.outsideVertexCount, 0);
  assert.deepEqual(result.endpointGapsMeters, [0, 0]);
});

test("out-of-bounds route segments and endpoint gaps are exposed without clamping or bridging", () => {
  const line = {
    ...geometry,
    coordinates: [
      [105.8, 21],
      [105.84, 21],
      [105.81, 21],
    ],
  };
  const result = projectRouteGeometry(
    line,
    transform,
    { width: 300, height: 400 },
    [origin, origin],
  );
  assert.equal(result.pixels.length, 3);
  assert.equal(result.outsideVertexCount, 1);
  assert.ok(result.bounds.maxX > 499);
  assert.ok(
    result.endpointGapsMeters[1] > 1000 && result.endpointGapsMeters[1] < 1100,
  );
});

test("endpoint separation is geographic metres rather than CRS.Simple pixel distance", () => {
  assert.ok(
    Math.abs(
      endpointDistanceMeters(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ) - 111195.08,
    ) < 1,
  );
  assert.equal(endpointDistanceMeters(origin, origin), 0);
  assert.throws(() =>
    projectRouteGeometry(geometry, transform, { width: 0, height: 400 }, [
      origin,
      origin,
    ]),
  );
  assert.throws(() =>
    endpointDistanceMeters(origin, { latitude: 100, longitude: 0 }),
  );
});
