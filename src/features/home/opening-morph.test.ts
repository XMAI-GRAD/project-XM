import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import {
  normalizeMorphPair,
  rawPathBounds,
  reverseSegment,
  signedArea,
} from "./opening-morph.ts";

function parseBrandLetters(filePath: URL) {
  const source = readFileSync(filePath, "utf8");
  const matches = source.matchAll(/d="([^"]+)"\s+data-brand-letter="([^"]+)"/g);
  return new Map(Array.from(matches, ([, d, key]) => [key, d]));
}

function projectRaw(
  raw: number[][],
  viewBox: { x: number; y: number; width: number; height: number },
  box: { left: number; top: number; width: number; height: number },
) {
  return raw.map((seg) => {
    const out = new Array<number>(seg.length);
    for (let i = 0; i < seg.length; i += 2) {
      out[i] = box.left + ((seg[i] - viewBox.x) * box.width) / viewBox.width;
      out[i + 1] =
        box.top + ((seg[i + 1] - viewBox.y) * box.height) / viewBox.height;
    }
    return out;
  });
}

function sampleSubpath(
  segment: readonly number[],
  samplesPerCubic = 8,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i + 7 < segment.length; i += 6) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = segment.slice(i, i + 8);
    for (let s = 0; s < samplesPerCubic; s++) {
      const t = s / samplesPerCubic;
      const mt = 1 - t;
      pts.push([
        mt * mt * mt * x0 +
          3 * mt * mt * t * x1 +
          3 * mt * t * t * x2 +
          t * t * t * x3,
        mt * mt * mt * y0 +
          3 * mt * mt * t * y1 +
          3 * mt * t * t * y2 +
          t * t * t * y3,
      ]);
    }
  }
  return pts;
}

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function hausdorffDistance(
  a: readonly [number, number][],
  b: readonly [number, number][],
) {
  const directed = (
    from: readonly [number, number][],
    to: readonly [number, number][],
  ) => {
    let maxMin = 0;
    for (const [fx, fy] of from) {
      let best = Infinity;
      for (let i = 0; i < to.length; i++) {
        const [ax, ay] = to[i];
        const [bx, by] = to[(i + 1) % to.length];
        const d = pointToSegmentDist(fx, fy, ax, ay, bx, by);
        if (d < best) best = d;
      }
      if (best > maxMin) maxMin = best;
    }
    return maxMin;
  };
  return Math.max(directed(a, b), directed(b, a));
}

describe("opening-morph geometry", () => {
  const srcLetters = parseBrandLetters(
    new URL("./art/opening-wordmark.tsx", import.meta.url),
  );
  const dstLetters = parseBrandLetters(
    new URL("./art/logo.tsx", import.meta.url),
  );
  // Real 1920x1080 boxes from WEB-01-Opening.svg and 02-Home.svg.
  const srcViewBox = { x: 774.63, y: 402.88, width: 370.74, height: 274.23 };
  const srcBox = { left: 774.5, top: 402.79, width: 371, height: 274.42 };
  const dstViewBox = { x: 860.1, y: 45.7, width: 201, height: 85.9 };
  const dstBox = { left: 860.09, top: 1125.69, width: 201, height: 85.89 };

  it("reverseSegment flips signed area while preserving cubic anchor/control order", () => {
    const seg = [0, 0, 10, 0, 10, 10, 10, 10, 10, 20, 0, 20, 0, 20];
    const rev = reverseSegment(seg);
    assert.deepEqual(rev, [0, 20, 0, 20, 10, 20, 10, 10, 10, 10, 10, 0, 0, 0]);
    assert.equal(Math.sign(signedArea(rev)), -Math.sign(signedArea(seg)));
  });

  it("matches subpath counts and winding directions for all 17 brand letters", () => {
    assert.equal(srcLetters.size, 17);
    assert.equal(dstLetters.size, 17);

    for (const [key, srcD] of srcLetters) {
      const dstD = dstLetters.get(key)!;
      const srcRaw = projectRaw(
        MorphSVGPlugin.stringToRawPath(srcD),
        srcViewBox,
        srcBox,
      );
      const dstRaw = projectRaw(
        MorphSVGPlugin.stringToRawPath(dstD),
        dstViewBox,
        dstBox,
      );

      const pair = normalizeMorphPair(srcRaw, dstRaw);
      // Every letter's normalized target must preserve the exact original target geometry.
      assert.equal(
        pair.target.length,
        dstRaw.length,
        `${key}: target subpath count must equal original target`,
      );
      for (let i = 0; i < dstRaw.length; i++) {
        const dist = hausdorffDistance(
          sampleSubpath(pair.target[i], 12),
          sampleSubpath(dstRaw[i], 12),
        );
        assert.ok(
          dist < 0.05,
          `${key}[${i}]: target geometry drifted by ${dist.toFixed(4)}px`,
        );
      }

      if (pair.mode === "morph") {
        assert.equal(
          pair.source.length,
          pair.target.length,
          `${key}: subpath count mismatch`,
        );
        for (let i = 0; i < pair.source.length; i++) {
          const sArea = signedArea(pair.source[i]);
          const tArea = signedArea(pair.target[i]);
          assert.equal(
            Math.sign(sArea),
            Math.sign(tArea),
            `${key}[${i}]: winding mismatch (${sArea} vs ${tArea})`,
          );
        }
      } else {
        assert.equal(pair.source.length, pair.sourceEnd.length);
        assert.equal(pair.targetStart.length, pair.target.length);
        assert.deepEqual(pair.target, dstRaw);
      }
    }
  });

  it("centers hanoi-o's synthesized inner hole inside the source star", () => {
    const srcRaw = projectRaw(
      MorphSVGPlugin.stringToRawPath(srcLetters.get("hanoi-o")!),
      srcViewBox,
      srcBox,
    );
    const dstRaw = projectRaw(
      MorphSVGPlugin.stringToRawPath(dstLetters.get("hanoi-o")!),
      dstViewBox,
      dstBox,
    );
    const { source, target } = normalizeMorphPair(srcRaw, dstRaw);
    assert.equal(source.length, 2);
    assert.equal(target.length, 2);

    const outer = rawPathBounds([source[0]]);
    const hole = rawPathBounds([source[1]]);
    const outerCx = (outer.minX + outer.maxX) / 2;
    const outerCy = (outer.minY + outer.maxY) / 2;
    const holeCx = (hole.minX + hole.maxX) / 2;
    const holeCy = (hole.minY + hole.maxY) / 2;

    assert.ok(Math.abs(holeCx - outerCx) < 0.01);
    assert.ok(Math.abs(holeCy - outerCy) < 0.01);
    assert.ok(hole.maxX - hole.minX < 0.1);
    assert.ok(hole.maxY - hole.minY < 0.1);
  });

  it("uses crossfade for creative-r while preserving the exact 4-subpath header R geometry", () => {
    const srcRaw = projectRaw(
      MorphSVGPlugin.stringToRawPath(srcLetters.get("creative-r")!),
      srcViewBox,
      srcBox,
    );
    const dstRaw = projectRaw(
      MorphSVGPlugin.stringToRawPath(dstLetters.get("creative-r")!),
      dstViewBox,
      dstBox,
    );
    const pair = normalizeMorphPair(srcRaw, dstRaw);
    assert.equal(pair.mode, "crossfade");
    assert.equal(pair.source.length, 2);
    assert.equal(pair.sourceEnd.length, 2);
    assert.equal(pair.targetStart.length, 4);
    assert.equal(pair.target.length, 4);
    assert.deepEqual(pair.target, dstRaw);

    const expectedSrc = rawPathBounds(srcRaw);
    const actualTargetStart = rawPathBounds(pair.targetStart);
    assert.ok(Math.abs(actualTargetStart.minX - expectedSrc.minX) < 0.05);
    assert.ok(Math.abs(actualTargetStart.minY - expectedSrc.minY) < 0.05);
    assert.ok(Math.abs(actualTargetStart.maxX - expectedSrc.maxX) < 0.05);
    assert.ok(Math.abs(actualTargetStart.maxY - expectedSrc.maxY) < 0.05);
  });

  it("reparameterizes creative-e1 and city-i to equal segment counts with matching top-left start", () => {
    for (const key of ["creative-e1", "city-i"]) {
      const srcRaw = projectRaw(
        MorphSVGPlugin.stringToRawPath(srcLetters.get(key)!),
        srcViewBox,
        srcBox,
      );
      const dstRaw = projectRaw(
        MorphSVGPlugin.stringToRawPath(dstLetters.get(key)!),
        dstViewBox,
        dstBox,
      );
      const { source, target, aligned } = normalizeMorphPair(srcRaw, dstRaw);
      assert.equal(aligned, true, `${key}: expected aligned=true`);
      assert.equal(
        source[0].length,
        target[0].length,
        `${key}: equal segment length`,
      );
      const sBounds = rawPathBounds([source[0]]);
      const tBounds = rawPathBounds([target[0]]);
      // Both start near their respective top-left corners
      assert.ok(
        Math.abs(source[0][0] - sBounds.minX) <
          (sBounds.maxX - sBounds.minX) * 0.25,
      );
      assert.ok(
        Math.abs(target[0][0] - tBounds.minX) <
          (tBounds.maxX - tBounds.minX) * 0.25,
      );
    }
  });
});
