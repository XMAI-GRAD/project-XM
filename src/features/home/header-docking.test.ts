import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOCK_PALE_FADE_EXTRA_PX,
  DOCK_TOTAL_VH,
  computeDockLayout,
  computeDockScale,
  dockHeaderOffset,
  dockProgress,
  dockRailToneProgress,
  dockStartY,
  resolveUnscaledSize,
  shouldInterceptLogoClick,
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

  it("starts docking at scrollY=0 on subpages with no opening, and only intercepts clicks when docked or on Home", () => {
    assert.equal(dockStartY({ openingBottom: null, scrollY: 0 }), 0);
    assert.equal(dockStartY({ openingBottom: null, scrollY: 500 }), 0);
    assert.equal(dockStartY({ openingBottom: 756, scrollY: 0 }), 756);
    assert.equal(dockStartY({ openingBottom: 456, scrollY: 300 }), 756);

    // Subpage at top (expanded): let <Link> navigate back to Home
    assert.equal(
      shouldInterceptLogoClick({ hasOpening: false, state: "expanded" }),
      false,
    );
    // Subpage docked in rail: intercept to smoothly return to top of current page
    assert.equal(
      shouldInterceptLogoClick({ hasOpening: false, state: "rail" }),
      true,
    );
    // Home: always intercept to return to Home header without replaying opening
    assert.equal(
      shouldInterceptLogoClick({ hasOpening: true, state: "expanded" }),
      true,
    );
    assert.equal(
      shouldInterceptLogoClick({ hasOpening: true, state: "rail" }),
      true,
    );
  });

  it("resolves untransformed CSS width/height for a scaled link and falls back cleanly", () => {
    // Even when link is scaled to 0.293x (rect=85.3), computed CSS width/height stay unscaled (200x85.3)
    assert.deepEqual(
      resolveUnscaledSize({
        cssWidth: "200px",
        cssHeight: "85.3px",
        fallbackWidth: 200,
        fallbackHeight: 85.3,
      }),
      { width: 200, height: 85.3 },
    );
    // Fallback when CSS returns "auto" or empty
    assert.deepEqual(
      resolveUnscaledSize({
        cssWidth: "auto",
        cssHeight: "",
        fallbackWidth: 200,
        fallbackHeight: 85.3,
      }),
      { width: 200, height: 85.3 },
    );
  });

  it("starts coloured -> pale fade at exact nav-band contact (bandTop === logoBottom) and eases to full cover + extra", () => {
    assert.ok(DOCK_PALE_FADE_EXTRA_PX >= 0 && DOCK_PALE_FADE_EXTRA_PX <= 100);
    const logoTop = 45.7;
    const logoBottom = 131.0;
    const span = logoBottom - logoTop + DOCK_PALE_FADE_EXTRA_PX;

    // Before contact: 0
    assert.equal(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: 176,
        reduced: false,
      }),
      0,
    );
    assert.equal(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoBottom,
        reduced: false,
      }),
      0,
    );
    // Immediately after contact: > 0
    assert.ok(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoBottom - 1,
        reduced: false,
      }) > 0,
    );

    // Monotonic and symmetric in reverse across the full span
    let prev = 0;
    for (let d = 10; d < span; d += 10) {
      const fwd = dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoBottom - d,
        reduced: false,
      });
      const rev = dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoBottom - (span - d),
        reduced: false,
      });
      assert.ok(fwd > prev && fwd < 1);
      assert.ok(Math.abs(fwd + rev - 1) < 1e-6);
      prev = fwd;
    }

    // At and past full cover + extra: 1
    assert.equal(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoTop - DOCK_PALE_FADE_EXTRA_PX,
        reduced: false,
      }),
      1,
    );
    assert.equal(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoTop - DOCK_PALE_FADE_EXTRA_PX - 100,
        reduced: false,
      }),
      1,
    );

    // Reduced motion: instant switch at contact
    assert.equal(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoBottom + 1,
        reduced: true,
      }),
      0,
    );
    assert.equal(
      dockRailToneProgress({
        logoTop,
        logoBottom,
        bandTop: logoBottom,
        reduced: true,
      }),
      1,
    );
  });
});
