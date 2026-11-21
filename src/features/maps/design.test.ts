import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { readMapDesign } from "./design.ts";

const fixture = () => parse(readFileSync("data/map-design.yaml", "utf8"));
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
});
