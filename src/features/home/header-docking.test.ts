import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOCK_TOTAL_VH,
  computeDockLayout,
  computeDockScale,
  dockHeaderOffset,
  dockProgress,
} from "./header-docking.ts";

describe("header-docking overlapping layout", () => {
  it("keeps total scroll ~5 notches and peak logo speed <= 3.2 px/px at both viewports", () => {
    assert.ok(DOCK_TOTAL_VH >= 0.45 && DOCK_TOTAL_VH <= 0.5);

    const desktop = computeDockLayout({
      viewportHeight: 1080,
      headerHeight: 258,
    });
    assert.equal(desktop.totalDistance, Math.round(1080 * DOCK_TOTAL_VH));
    assert.equal(desktop.holdDistance, desktop.totalDistance - 258);
    // Peak power2.inOut slope is 2.0 * (dx / totalDistance)
    const peak1920 = 2 * (812.8 / desktop.totalDistance);
    assert.ok(peak1920 <= 3.2, `expected peak1920 <= 3.2, got ${peak1920}`);

    const laptop = computeDockLayout({
      viewportHeight: 900,
      headerHeight: 193.5,
    });
    assert.equal(laptop.totalDistance, Math.round(900 * DOCK_TOTAL_VH));
    assert.equal(laptop.holdDistance, laptop.totalDistance - 193.5);
    const peak1440 = 2 * (609.6 / laptop.totalDistance);
    assert.ok(peak1440 <= 3.2, `expected peak1440 <= 3.2, got ${peak1440}`);
  });

  it("keeps logo viewport-Y completely constant while the header exits during the overlap", () => {
    const { totalDistance, holdDistance } = computeDockLayout({
      viewportHeight: 1080,
      headerHeight: 258,
    });
    const logoTop = 45.7;
    for (let offset = 0; offset <= totalDistance + 300; offset += 25) {
      const { heldScroll, headerExit, logoFollowY } = dockHeaderOffset({
        offset,
        holdDistance,
      });
      const headerViewportTop = heldScroll - offset;
      const logoViewportTop = headerViewportTop + logoTop + logoFollowY;
      assert.ok(
        Math.abs(logoViewportTop - logoTop) < 1e-6,
        `logo shifted at offset=${offset}: ${logoViewportTop}`,
      );
      if (offset <= holdDistance) {
        assert.equal(headerExit, 0);
      } else {
        assert.equal(headerExit, offset - holdDistance);
      }
    }
  });
});

describe("header-docking scroll-scrubbed progress", () => {
  it("is monotonic from 0 to 1 across totalDistance and symmetric in reverse", () => {
    const total = 518;
    let prev = -1;
    for (let offset = 0; offset <= total; offset += 10) {
      const p = dockProgress({ offset, totalDistance: total });
      assert.ok(p >= prev, `non-monotonic at ${offset}: ${p} < ${prev}`);
      prev = p;
      const rev = dockProgress({
        offset: total - offset,
        totalDistance: total,
      });
      assert.ok(Math.abs(p + rev - 1) < 1e-6);
    }
    assert.equal(dockProgress({ offset: -20, totalDistance: total }), 0);
    assert.equal(dockProgress({ offset: total, totalDistance: total }), 1);
    assert.equal(
      dockProgress({ offset: total + 200, totalDistance: total }),
      1,
    );
  });

  it("computes transform scaleX/scaleY and exact inverse flight scale without width/height writes", () => {
    const end = computeDockScale({
      progress: 1,
      width: 291,
      height: 88,
      railWidth: 86,
      railHeight: 86,
    });
    assert.ok(Math.abs(end.scaleX * end.flightScaleX - 1) < 1e-6);
    assert.ok(Math.abs(end.scaleY * end.flightScaleY - 1) < 1e-6);
  });
});
