import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fitArtworkTransform,
  projectToArtwork,
  validCoordinates,
  type CalibrationLandmark,
} from "./georeference.ts";

function landmark(
  latitude: number,
  longitude: number,
  x: number,
  y: number,
): CalibrationLandmark {
  return {
    id: `${latitude},${longitude}`,
    name: "Test landmark",
    coordinates: { latitude, longitude },
    image: { x, y },
    source: "test",
  };
}

test("fits a geographic grid and preserves the image's downward y axis", () => {
  const transform = fitArtworkTransform({ latitude: 0, longitude: 0 }, [
    landmark(0, 0, 10, 1020),
    landmark(0, 1, 110, 1020),
    landmark(45, 0, 10, 20),
    landmark(45, 1, 110, 20),
  ]);
  const middle = projectToArtwork({ latitude: 0, longitude: 0.5 }, transform);
  assert.ok(Math.abs(middle.x - 60) < 1e-7);
  assert.ok(Math.abs(middle.y - 1020) < 1e-7);
  const north = projectToArtwork({ latitude: 45, longitude: 0.5 }, transform);
  assert.ok(Math.abs(north.y - 20) < 1e-7);
});

test("rejects insufficient and collinear control points", () => {
  const origin = { latitude: 21, longitude: 105.8 };
  assert.throws(() => fitArtworkTransform(origin, []), /three/);
  assert.throws(
    () =>
      fitArtworkTransform(origin, [
        landmark(21, 105.8, 0, 0),
        landmark(21, 105.81, 10, 0),
        landmark(21, 105.82, 20, 0),
      ]),
    /collinear/,
  );
});

test("rejects non-finite coordinates and latitudes outside Web Mercator", () => {
  assert.equal(validCoordinates({ latitude: NaN, longitude: 105.8 }), false);
  assert.equal(validCoordinates({ latitude: 90, longitude: 0 }), false);
  assert.equal(validCoordinates({ latitude: 21, longitude: 181 }), false);
  assert.equal(
    validCoordinates({ latitude: 21.0323458, longitude: 105.852837 }),
    true,
  );
});
