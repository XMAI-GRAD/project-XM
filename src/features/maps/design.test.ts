import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { readIllustratedRoutes, readMapDesign } from "./design.ts";

const fixture = () => parse(readFileSync("data/map-design.yaml", "utf8"));
const routesFixture = () =>
  parse(readFileSync("data/map-design-routes.yaml", "utf8"));
const codes = readdirSync("data/points")
  .filter((file) => file.endsWith(".yaml"))
  .flatMap((file) => parse(readFileSync(`data/points/${file}`, "utf8")))
  .map((point) => point.code);

test("new artwork covers every canonical point and preserves the supplied university pin", () => {
  const design = readMapDesign(fixture(), codes);
  assert.equal(codes.length, 12);
  assert.equal(design.origin.latitude, 20.981012);
  assert.equal(design.origin.longitude, 105.7892685);
  assert.ok(
    readFileSync(`public${design.artwork.src}`, "utf8").startsWith("<svg"),
  );
});

test("rejects stale, incomplete and off-artwork point manifests", () => {
  const missing = fixture();
  delete missing.pins[codes[0]];
  assert.throws(() => readMapDesign(missing, codes));
  const swapped = fixture();
  swapped.pins.obsolete = swapped.pins[codes[0]];
  delete swapped.pins[codes[0]];
  assert.throws(() => readMapDesign(swapped, codes), /authored pin/);
  const outside = fixture();
  outside.pins[codes[0]].x = outside.artwork.width + 1;
  assert.throws(() => readMapDesign(outside, codes), /authored pin/);
});

test("rejects treating authored positions as geography and invalid fixed origins", () => {
  const geographic = fixture();
  geographic.coordinateSpace = "geographic";
  assert.throws(() => readMapDesign(geographic, codes));
  const invalid = fixture();
  invalid.origin.longitude = 500;
  assert.throws(() => readMapDesign(invalid, codes), /origin/);
  const missingAnchor = fixture();
  delete missingAnchor.origin.position;
  assert.throws(() => readMapDesign(missingAnchor, codes), /origin/);
  const outside = fixture();
  outside.origin.position.y = outside.artwork.height + 1;
  assert.throws(() => readMapDesign(outside, codes), /origin/);
});

test("every illustrated route connects the fixed origin to its authored destination", () => {
  const design = readMapDesign(fixture(), codes);
  const routes = readIllustratedRoutes(routesFixture(), design);
  assert.deepEqual(Object.keys(routes).sort(), [...codes].sort());
  for (const code of codes) {
    assert.deepEqual(routes[code][0], [
      design.origin.position.x,
      design.origin.position.y,
    ]);
    assert.deepEqual(routes[code].at(-1), [
      design.pins[code].x,
      design.pins[code].y,
    ]);
  }
});

test("rejects stale artwork, missing routes, broken endpoints and invalid vertices", () => {
  const design = readMapDesign(fixture(), codes);
  const invalidEdits = [
    (data) => {
      data.sourceSha256 = "0".repeat(64);
    },
    (data) => {
      data.coordinateSpace = "geographic";
    },
    (data) => {
      data.kind = "walking";
    },
    (data) => {
      delete data.routes.d01;
    },
    (data) => {
      data.routes.obsolete = data.routes.d01;
      delete data.routes.d01;
    },
    (data) => {
      data.routes.d01 = [];
    },
    (data) => {
      data.routes.d01[0] = [0, 0];
    },
    (data) => {
      data.routes.d01[data.routes.d01.length - 1] = data.routes.d02.at(-1);
    },
    (data) => {
      data.routes.d01[1] = [1095, 0];
    },
    (data) => {
      data.routes.d01[1] = [0, -1];
    },
    (data) => {
      data.routes.d01[1] = [NaN, 0];
    },
    (data) => {
      data.routes.d01[1] = [0, 0, 0];
    },
    (data) => {
      data.routes.d01[1] = null;
    },
  ] satisfies ((data: ReturnType<typeof routesFixture>) => void)[];
  for (const edit of invalidEdits) {
    const data = routesFixture();
    edit(data);
    assert.throws(
      () => readIllustratedRoutes(data, design),
      /illustrated route/,
    );
  }
  const movedOrigin = structuredClone(design);
  movedOrigin.origin.position.x++;
  assert.throws(
    () => readIllustratedRoutes(routesFixture(), movedOrigin),
    /illustrated route/,
  );
  const movedPin = structuredClone(design);
  movedPin.pins.d01.y++;
  assert.throws(
    () => readIllustratedRoutes(routesFixture(), movedPin),
    /illustrated route/,
  );
});
