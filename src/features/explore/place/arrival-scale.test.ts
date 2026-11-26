import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  arrivalScale,
  computeArrivalFrame,
  resolveArrival,
} from "./arrival-scale.ts";

describe("arrivalScale", () => {
  const gateRect = { width: 260.94, height: 234.17 };
  const heroRect = { width: 883.72, height: 546.49 };

  it("uses destination hero content dimensions even when the hero img is unloaded (naturalWidth = 0)", () => {
    const scale = arrivalScale({
      gateRect,
      heroRect,
      heroPhoto: { width: 2400, height: 1483 },
      loaded: { width: 0, height: 0 },
      handoff: { width: 2400, height: 2154 },
    });
    assert.ok(
      Math.abs(scale - 0.4285) < 0.001,
      `expected ~0.4285 using detail photo dims, got ${scale}`,
    );
  });

  it("matches the loaded hero image scale so there is no zoom jump on decode", () => {
    const unloaded = arrivalScale({
      gateRect,
      heroRect,
      heroPhoto: { width: 2400, height: 1483 },
      loaded: { width: 0, height: 0 },
      handoff: { width: 2400, height: 2154 },
    });
    const decoded = arrivalScale({
      gateRect,
      heroRect,
      heroPhoto: { width: 2400, height: 1483 },
      loaded: { width: 2400, height: 1483 },
      handoff: { width: 2400, height: 2154 },
    });
    assert.equal(unloaded, decoded);
  });

  it("falls back to handoff dims then rect ratio when no hero photo dims exist", () => {
    const fromHandoff = arrivalScale({
      gateRect,
      heroRect,
      loaded: { width: 0, height: 0 },
      handoff: { width: 2400, height: 2154 },
    });
    assert.ok(Math.abs(fromHandoff - 0.2953) < 0.001);

    const fromRects = arrivalScale({
      gateRect,
      heroRect,
      loaded: { width: 0, height: 0 },
      handoff: { width: 0, height: 0 },
    });
    assert.equal(
      fromRects,
      Math.max(
        gateRect.width / heroRect.width,
        gateRect.height / heroRect.height,
      ),
    );
  });
});

describe("computeArrivalFrame", () => {
  const gateRect = { left: 920, top: 334, width: 198.6, height: 178.2 };
  const heroRect = { left: 207.8, top: 478.9, width: 655.9, height: 405.6 };
  const startScale = arrivalScale({
    gateRect,
    heroRect,
    heroPhoto: { width: 2400, height: 1485 },
  });

  it("matches gateRect at progress=0 and heroRect at progress=1", () => {
    const start = computeArrivalFrame({
      gateRect,
      heroRect,
      startScale,
      progress: 0,
    });
    const end = computeArrivalFrame({
      gateRect,
      heroRect,
      startScale,
      progress: 1,
    });

    const startVisW =
      start.boxWidth * start.scale * (1 - (2 * start.insetX) / 100);
    const startVisH =
      start.boxHeight * start.scale * (1 - (2 * start.insetY) / 100);
    assert.ok(Math.abs(startVisW - gateRect.width) < 0.2);
    assert.ok(Math.abs(startVisH - gateRect.height) < 0.2);

    assert.equal(end.x, 0);
    assert.equal(end.y, 0);
    assert.equal(end.scale, 1);
    const endVisW = end.boxWidth * end.scale * (1 - (2 * end.insetX) / 100);
    const endVisH = end.boxHeight * end.scale * (1 - (2 * end.insetY) / 100);
    assert.ok(Math.abs(endVisW - heroRect.width) < 0.2);
    assert.ok(Math.abs(endVisH - heroRect.height) < 0.2);
  });

  it("smoothly widens the visible frame aspect ratio from ~1.11 to ~1.62 mid-flight (never stuck square)", () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      computeArrivalFrame({ gateRect, heroRect, startScale, progress }),
    );
    const aspects = samples.map(
      (f) =>
        (f.boxWidth * f.scale * (1 - (2 * f.insetX) / 100)) /
        (f.boxHeight * f.scale * (1 - (2 * f.insetY) / 100)),
    );
    for (let i = 1; i < aspects.length; i++) {
      assert.ok(
        aspects[i] > aspects[i - 1] + 0.05,
        `expected aspect ratio to grow smoothly: ${aspects.join(", ")}`,
      );
    }
    assert.ok(
      samples[2].insetX < samples[0].insetX * 0.5,
      `expected midpoint insetX (${samples[2].insetX}) to be well below start (${samples[0].insetX})`,
    );
  });
});

describe("resolveArrival", () => {
  const old = { slug: "a", at: 1 };
  const fresh = { slug: "a", at: 2 };

  it("first mount without a gate click: no hand-off, arrival pending", () => {
    assert.deepEqual(
      resolveArrival({ arrived: false, handoff: undefined }, null),
      {
        arrived: false,
        handoff: null,
      },
    );
  });

  it("revisit of a preserved page through a gate replays the flight", () => {
    assert.deepEqual(resolveArrival({ arrived: true, handoff: null }, fresh), {
      arrived: false,
      handoff: fresh,
    });
  });

  it("a fresh gate click replaces a stale hand-off", () => {
    assert.deepEqual(resolveArrival({ arrived: false, handoff: old }, fresh), {
      arrived: false,
      handoff: fresh,
    });
  });

  it("Strict Mode re-run (hand-off already taken) keeps the captured hand-off", () => {
    assert.deepEqual(resolveArrival({ arrived: false, handoff: fresh }, null), {
      arrived: false,
      handoff: fresh,
    });
  });

  it("revisit via Back (no gate click) stays settled", () => {
    assert.deepEqual(resolveArrival({ arrived: true, handoff: null }, null), {
      arrived: true,
      handoff: null,
    });
  });
});
