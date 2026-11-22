import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OPENING_SCROLL_VH,
  computeOpeningGeometry,
  openingTransitionEnd,
} from "./opening-snap.ts";

describe("computeOpeningGeometry", () => {
  it("decouples 0.7*vh scroll distance from 1.0*vh visual height with exact offsets at 0, 0.5, 1", () => {
    const start = computeOpeningGeometry({
      viewportHeight: 1080,
      scrollVh: OPENING_SCROLL_VH,
      wordmarkEnd: 0.72,
      progress: 0,
    });
    assert.equal(start.visualHeight, 1080);
    assert.equal(start.distance, 756);
    assert.equal(start.boardY, -756);
    assert.equal(start.backdropY, 0);
    assert.equal(start.movingLettersY, 0);

    const mid = computeOpeningGeometry({
      viewportHeight: 1080,
      scrollVh: OPENING_SCROLL_VH,
      wordmarkEnd: 0.72,
      progress: 0.5,
    });
    assert.equal(mid.boardY, -378);
    assert.equal(mid.backdropY, 378);

    const end = computeOpeningGeometry({
      viewportHeight: 1080,
      scrollVh: OPENING_SCROLL_VH,
      wordmarkEnd: 0.72,
      progress: 1,
    });
    assert.equal(end.boardY, 0);
    assert.equal(end.backdropY, 756);
    assert.equal(end.movingLettersY, 0);
  });
});

describe("openingTransitionEnd", () => {
  it("computes the exact decoupled transition end shared by opening and header-motion", () => {
    assert.equal(openingTransitionEnd(756, 0), 756);
    assert.equal(openingTransitionEnd(456, 300), 756);
    assert.equal(openingTransitionEnd(0, 756), 756);
    assert.equal(openingTransitionEnd(-200, 956), 756);
    assert.equal(openingTransitionEnd(629.4, 0), 630);
    assert.equal(openingTransitionEnd(1080, 0), 1080);
  });
});
