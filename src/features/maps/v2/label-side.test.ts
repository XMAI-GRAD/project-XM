import assert from "node:assert/strict";
import { test } from "node:test";
import { artworkLabelLayout } from "./label-side.ts";

const artwork = { width: 1094, height: 680 };
const label = { width: 100, height: 34 };

test("a northern label uses the right at overview and above after zooming", () => {
  const input = { artwork, anchor: { x: 734.05, y: 46.45 }, label };
  assert.equal(artworkLabelLayout({ ...input, scale: 0.768 }).side, "right");
  assert.equal(artworkLabelLayout({ ...input, scale: 2 }).side, "above");
});

test("labels at opposite artwork edges face inward", () => {
  assert.equal(
    artworkLabelLayout({
      artwork,
      anchor: { x: 37.85, y: 300 },
      label,
      scale: 1,
    }).side,
    "right",
  );
  const rightEdge = artworkLabelLayout({
    artwork,
    anchor: { x: 1080, y: 300 },
    label,
    scale: 1,
  });
  assert.equal(rightEdge.side, "left");
  assert.deepEqual(rightEdge.footprint, {
    left: 126,
    right: 22,
    top: 22,
    bottom: 22,
  });
});

test("near the upper-right corner, left fits where above and right do not", () => {
  const layout = artworkLabelLayout({
    artwork,
    anchor: { x: 1050, y: 30 },
    label,
    scale: 1,
  });
  assert.equal(layout.side, "left");
});

test("a pin at the very top uses below when both side labels cross the top", () => {
  const layout = artworkLabelLayout({
    artwork,
    anchor: { x: 550, y: 5 },
    label,
    scale: 1,
  });
  assert.equal(layout.side, "below");
  assert.deepEqual(layout.footprint, {
    left: 50,
    right: 50,
    top: 22,
    bottom: 60,
  });
});

test("measured label growth can require a different fallback", () => {
  const input = { artwork, anchor: { x: 734.05, y: 46.45 }, scale: 0.768 };
  assert.equal(artworkLabelLayout({ ...input, label }).side, "right");
  assert.equal(
    artworkLabelLayout({ ...input, label: { width: 320, height: 60 } }).side,
    "left",
  );
  assert.equal(
    artworkLabelLayout({ ...input, label: { width: 320, height: 90 } }).side,
    "below",
  );
});

test("when no side fits, choose the most visible label without detaching it", () => {
  // All placements overflow this small artwork. Below retains 80x24px of the
  // label, versus only 24x40px at either side and none above.
  const layout = artworkLabelLayout({
    artwork: { width: 100, height: 60 },
    anchor: { x: 50, y: 10 },
    label: { width: 80, height: 60 },
    scale: 1,
  });
  assert.equal(layout.side, "below");
  assert.deepEqual(layout.footprint, {
    left: 40,
    right: 40,
    top: 22,
    bottom: 86,
  });
});

test("artwork coordinates keep the side independent of viewport or pan", () => {
  // This same pin can be off-screen or next to a frame edge while still having
  // plenty of artwork above it. Neither case authorizes a placement change.
  const layout = artworkLabelLayout({
    artwork,
    anchor: { x: 330, y: 590 },
    label: { width: 220, height: 52 },
    scale: 1,
  });
  assert.equal(layout.side, "above");
  assert.deepEqual(layout.footprint, {
    left: 110,
    right: 110,
    top: 74,
    bottom: 22,
  });
});

test("the selected camera accounts for the right-hand label's full footprint", () => {
  const layout = artworkLabelLayout({
    artwork,
    anchor: { x: 734.05, y: 46.45 },
    label: { width: 220, height: 60 },
    scale: 0.768,
  });
  assert.equal(layout.side, "right");
  assert.deepEqual(layout.footprint, {
    left: 22,
    right: 246,
    top: 30,
    bottom: 30,
  });
});
