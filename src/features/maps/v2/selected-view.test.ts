import assert from "node:assert/strict";
import { test } from "node:test";
import { selectedMapView } from "./selected-view.ts";
import { artworkLabelLayout } from "./label-side.ts";

const artwork = { width: 1094, height: 680 };
const viewport = { width: 840, height: 522 };
const scale = Math.max(
  viewport.width / artwork.width,
  viewport.height / artwork.height,
);
const footprint = { left: 50, right: 50, top: 56, bottom: 22 };

test("an edge label gets room while the image still covers the viewport", () => {
  for (const anchor of [
    { x: 734.05, y: 46.45 },
    { x: 37.85, y: 631.25 },
  ]) {
    const view = selectedMapView({
      artwork,
      viewport,
      anchor,
      footprint,
      preferred: { x: anchor.x * scale, y: anchor.y * scale },
      scale,
      maxScale: 8,
    });
    assert(view);
    const left = viewport.width / 2 - view.center.x * view.scale;
    const top = viewport.height / 2 - view.center.y * view.scale;
    const pin = {
      x: left + anchor.x * view.scale,
      y: top + anchor.y * view.scale,
    };
    assert(left <= 0.01 && top <= 0.01);
    assert(left + artwork.width * view.scale >= viewport.width - 0.01);
    assert(top + artwork.height * view.scale >= viewport.height - 0.01);
    assert(pin.x - footprint.left >= 11.99 && pin.y - footprint.top >= 11.99);
    assert(pin.x + footprint.right <= viewport.width - 11.99);
    assert(pin.y + footprint.bottom <= viewport.height - 11.99);
  }
});

test("an already readable pin keeps its camera and scale", () => {
  const anchor = { x: 550, y: 340 };
  const preferred = { x: anchor.x * scale, y: anchor.y * scale };
  const view = selectedMapView({
    artwork,
    viewport,
    anchor,
    footprint,
    preferred,
    scale,
    maxScale: 8,
  });
  assert(view);
  assert.equal(view.scale, scale);
  assert(Math.abs(view.center.x - viewport.width / 2 / scale) < 0.001);
  assert(Math.abs(view.center.y - viewport.height / 2 / scale) < 0.001);
});

test("the complete label and pin clear a card, even when the pin alone fits", () => {
  const anchor = { x: 660, y: 300 };
  const obstacle = { left: 520, right: 820, top: 30, bottom: 480 };
  const view = selectedMapView({
    artwork,
    viewport,
    anchor,
    footprint,
    preferred: { x: 500, y: 250 },
    scale: 1,
    maxScale: 8,
    obstacles: [obstacle],
  });
  assert(view);
  const pinX = viewport.width / 2 + (anchor.x - view.center.x) * view.scale;
  const pinY = viewport.height / 2 + (anchor.y - view.center.y) * view.scale;
  assert(
    pinX + footprint.right <= obstacle.left - 8 ||
      pinX - footprint.left >= obstacle.right + 8 ||
      pinY + footprint.bottom <= obstacle.top - 8 ||
      pinY - footprint.top >= obstacle.bottom + 8,
  );
});

test("a label too large for the viewport has no valid camera", () => {
  assert.equal(
    selectedMapView({
      artwork,
      viewport: { width: 100, height: 100 },
      anchor: { x: 550, y: 340 },
      footprint: { left: 80, right: 80, top: 56, bottom: 22 },
      preferred: { x: 50, y: 50 },
      scale: 1,
      maxScale: 8,
    }),
    null,
  );
});

test("camera fitting remeasures the footprint when zoom changes the label side", () => {
  const anchor = { x: 734.05, y: 46.45 };
  const label = { width: 220, height: 60 };
  const layout = (scale: number) =>
    artworkLabelLayout({ artwork, anchor, label, scale });
  assert.equal(layout(scale).side, "right");
  const view = selectedMapView({
    artwork,
    viewport,
    anchor,
    footprint: (scale) => layout(scale).footprint,
    preferred: { x: anchor.x * scale, y: anchor.y * scale },
    scale,
    maxScale: 8,
    obstacles: [{ left: 400, right: 840, top: 0, bottom: 522 }],
  });
  assert(view);
  assert.equal(layout(view.scale).side, "above");
  const occupied = layout(view.scale).footprint;
  const pinX = viewport.width / 2 + (anchor.x - view.center.x) * view.scale;
  const pinY = viewport.height / 2 + (anchor.y - view.center.y) * view.scale;
  assert(pinY - occupied.top >= 11.99);
  assert(pinX + occupied.right <= 392.01);
});

test("left and below fallbacks stay readable when a location is selected", () => {
  for (const [anchor, label, expectedSide] of [
    [{ x: 1080, y: 300 }, { width: 100, height: 34 }, "left"],
    [{ x: 550, y: 15 }, { width: 160, height: 100 }, "below"],
  ] as const) {
    const layout = (scale: number) =>
      artworkLabelLayout({ artwork, anchor, label, scale });
    const view = selectedMapView({
      artwork,
      viewport,
      anchor,
      footprint: (scale) => layout(scale).footprint,
      preferred: { x: anchor.x, y: anchor.y },
      scale: 1,
      maxScale: 8,
    });
    assert(view);
    assert.equal(layout(view.scale).side, expectedSide);
    const occupied = layout(view.scale).footprint;
    const left = viewport.width / 2 - view.center.x * view.scale;
    const top = viewport.height / 2 - view.center.y * view.scale;
    const pin = {
      x: left + anchor.x * view.scale,
      y: top + anchor.y * view.scale,
    };
    assert(left <= 0.01 && top <= 0.01);
    assert(left + artwork.width * view.scale >= viewport.width - 0.01);
    assert(top + artwork.height * view.scale >= viewport.height - 0.01);
    assert(pin.x - occupied.left >= 11.99 && pin.y - occupied.top >= 11.99);
    assert(pin.x + occupied.right <= viewport.width - 11.99);
    assert(pin.y + occupied.bottom <= viewport.height - 11.99);
  }
});
