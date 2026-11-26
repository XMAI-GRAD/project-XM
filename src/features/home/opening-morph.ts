export interface RawPathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type NormalizedMorphPair =
  | {
      mode: "morph";
      source: number[][];
      target: number[][];
      /** True when segment counts and start anchors were explicitly aligned (use shapeIndex: 0). */
      aligned: boolean;
    }
  | {
      mode: "crossfade";
      source: number[][];
      sourceEnd: number[][];
      targetStart: number[][];
      target: number[][];
      aligned: true;
    };

/** Shoelace signed area over a cubic RawPath segment's anchor points (CW > 0 in SVG coords). */
export function signedArea(segment: readonly number[]): number {
  let area = 0;
  const count = Math.floor((segment.length - 2) / 6) + 1;
  if (count < 3) return 0;
  for (let i = 0; i < count; i++) {
    const a = i * 6;
    const b = ((i + 1) % count) * 6;
    area += segment[a] * segment[b + 1] - segment[b] * segment[a + 1];
  }
  return area / 2;
}

/** Reverse a cubic RawPath segment so its winding flips while keeping exact geometry. */
export function reverseSegment(segment: readonly number[]): number[] {
  const out = new Array<number>(segment.length);
  for (let i = 0; i < segment.length; i += 2) {
    const j = segment.length - 2 - i;
    out[i] = segment[j];
    out[i + 1] = segment[j + 1];
  }
  return out;
}

/** Bounding box across all coordinates of a RawPath. */
export function rawPathBounds(
  raw: readonly (readonly number[])[],
): RawPathBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const segment of raw) {
    for (let i = 0; i < segment.length; i += 2) {
      const x = segment[i];
      const y = segment[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function mapRawToBounds(
  raw: readonly (readonly number[])[],
  from: RawPathBounds,
  to: RawPathBounds,
): number[][] {
  const fromW = from.maxX - from.minX || 1;
  const fromH = from.maxY - from.minY || 1;
  const toW = to.maxX - to.minX;
  const toH = to.maxY - to.minY;
  return raw.map((segment) => {
    const out = new Array<number>(segment.length);
    for (let i = 0; i < segment.length; i += 2) {
      out[i] = to.minX + ((segment[i] - from.minX) * toW) / fromW;
      out[i + 1] = to.minY + ((segment[i + 1] - from.minY) * toH) / fromH;
    }
    return out;
  });
}

function collapseSegmentToPoint(
  segment: readonly number[],
  cx: number,
  cy: number,
  scale = 0.001,
): number[] {
  const bounds = rawPathBounds([segment]);
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;
  const out = new Array<number>(segment.length);
  for (let i = 0; i < segment.length; i += 2) {
    out[i] = cx + (segment[i] - midX) * scale;
    out[i + 1] = cy + (segment[i + 1] - midY) * scale;
  }
  return out;
}

type Cubic = [number, number, number, number, number, number, number, number];

function toCubics(segment: readonly number[]): Cubic[] {
  const cubics: Cubic[] = [];
  for (let i = 0; i + 7 < segment.length; i += 6) {
    const c: Cubic = [
      segment[i],
      segment[i + 1],
      segment[i + 2],
      segment[i + 3],
      segment[i + 4],
      segment[i + 5],
      segment[i + 6],
      segment[i + 7],
    ];
    const span =
      Math.abs(c[6] - c[0]) +
      Math.abs(c[7] - c[1]) +
      Math.abs(c[2] - c[0]) +
      Math.abs(c[3] - c[1]) +
      Math.abs(c[4] - c[0]) +
      Math.abs(c[5] - c[1]);
    if (span > 1e-4) cubics.push(c);
  }
  return cubics;
}

function fromCubics(cubics: readonly Cubic[]): number[] {
  if (!cubics.length) return [];
  const out: number[] = [cubics[0][0], cubics[0][1]];
  for (const c of cubics) {
    out.push(c[2], c[3], c[4], c[5], c[6], c[7]);
  }
  return out;
}

function cubicLength(c: Cubic, steps = 8): number {
  let len = 0;
  let px = c[0];
  let py = c[1];
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * c[0] +
      3 * mt * mt * t * c[2] +
      3 * mt * t * t * c[4] +
      t * t * t * c[6];
    const y =
      mt * mt * mt * c[1] +
      3 * mt * mt * t * c[3] +
      3 * mt * t * t * c[5] +
      t * t * t * c[7];
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

function splitCubic(c: Cubic, t: number): [Cubic, Cubic] {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  const x01 = x0 + (x1 - x0) * t;
  const y01 = y0 + (y1 - y0) * t;
  const x12 = x1 + (x2 - x1) * t;
  const y12 = y1 + (y2 - y1) * t;
  const x23 = x2 + (x3 - x2) * t;
  const y23 = y2 + (y3 - y2) * t;
  const x012 = x01 + (x12 - x01) * t;
  const y012 = y01 + (y12 - y01) * t;
  const x123 = x12 + (x23 - x12) * t;
  const y123 = y12 + (y23 - y12) * t;
  const x0123 = x012 + (x123 - x012) * t;
  const y0123 = y012 + (y123 - y012) * t;
  return [
    [x0, y0, x01, y01, x012, y012, x0123, y0123],
    [x0123, y0123, x123, y123, x23, y23, x3, y3],
  ];
}

function rotateToTopLeft(cubics: Cubic[]): Cubic[] {
  if (cubics.length < 2) return cubics;
  const bounds = rawPathBounds([fromCubics(cubics)]);
  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;
  let best = 0;
  let bestScore = Infinity;
  for (let i = 0; i < cubics.length; i++) {
    const nx = (cubics[i][0] - bounds.minX) / w;
    const ny = (cubics[i][1] - bounds.minY) / h;
    const score = nx + ny;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best === 0
    ? cubics
    : [...cubics.slice(best), ...cubics.slice(0, best)];
}

function normalizedStops(cubics: readonly Cubic[]): number[] {
  const lengths = cubics.map((c) => cubicLength(c));
  const total = lengths.reduce((sum, l) => sum + l, 0) || 1;
  const stops = [0];
  let acc = 0;
  for (let i = 0; i < lengths.length; i++) {
    acc += lengths[i];
    stops.push(i === lengths.length - 1 ? 1 : acc / total);
  }
  return stops;
}

function subdivideAtStops(
  cubics: readonly Cubic[],
  ownStops: readonly number[],
  mergedStops: readonly number[],
): Cubic[] {
  const out: Cubic[] = [];
  let segIdx = 0;
  let curCubic = cubics[0];
  let curU0 = ownStops[0];
  let curU1 = ownStops[1];

  for (let i = 1; i < mergedStops.length; i++) {
    const targetU = mergedStops[i];
    while (segIdx + 1 < cubics.length && targetU > curU1 + 1e-6) {
      out.push(curCubic);
      segIdx++;
      curCubic = cubics[segIdx];
      curU0 = ownStops[segIdx];
      curU1 = ownStops[segIdx + 1];
    }
    if (Math.abs(targetU - curU1) <= 1e-6 || i === mergedStops.length - 1) {
      out.push(curCubic);
      segIdx++;
      if (segIdx < cubics.length) {
        curCubic = cubics[segIdx];
        curU0 = ownStops[segIdx];
        curU1 = ownStops[segIdx + 1];
      }
    } else {
      const span = curU1 - curU0;
      const t = span > 1e-9 ? (targetU - curU0) / span : 0.5;
      const [left, right] = splitCubic(curCubic, Math.max(0, Math.min(1, t)));
      out.push(left);
      curCubic = right;
      curU0 = targetU;
    }
  }
  return out;
}

/**
 * Align two closed subpaths by starting both at their top-left corner and inserting
 * exact De Casteljau splits at the union of their normalized arc-length stops.
 * Preserves 100% exact source and target geometry while preventing perimeter vertex slide.
 */
function alignSubpathPair(
  srcSeg: readonly number[],
  dstSeg: readonly number[],
): [number[], number[]] {
  const srcCubics = rotateToTopLeft(toCubics(srcSeg));
  const dstCubics = rotateToTopLeft(toCubics(dstSeg));
  if (!srcCubics.length || !dstCubics.length) {
    return [[...srcSeg], [...dstSeg]];
  }
  const srcStops = normalizedStops(srcCubics);
  const dstStops = normalizedStops(dstCubics);
  const all = [...srcStops, ...dstStops].sort((a, b) => a - b);
  const merged: number[] = [0];
  for (const u of all) {
    if (u > merged[merged.length - 1] + 1e-7 && u < 1 - 1e-7) {
      merged.push(u);
    }
  }
  merged.push(1);
  return [
    fromCubics(subdivideAtStops(srcCubics, srcStops, merged)),
    fromCubics(subdivideAtStops(dstCubics, dstStops, merged)),
  ];
}

/**
 * Harmonize subpath counts, winding directions, and arc-length parameterization between
 * a projected source and target RawPath before MorphSVGPlugin interpolates them:
 * - Unmerged multi-subpath targets (e.g. `creative-r`, 2 -> 4 subpaths): remap the clean
 *   2-subpath source outline into the target's exact bounding box so topology matches.
 * - Solid-to-holed letters (e.g. `hanoi-o`, 1 -> 2 subpaths): match outer winding, align
 *   outer arc-length stops, and seed the inner hole at the source center.
 * - Opposite-winding or differing-segment letters (e.g. `creative-e1`, `city-i`): reverse
 *   to matching winding and align arc-length stops from the top-left corner.
 */
export function normalizeMorphPair(
  sourceRaw: readonly (readonly number[])[],
  targetRaw: readonly (readonly number[])[],
): NormalizedMorphPair {
  const source = sourceRaw.map((segment) => [...segment]);
  const target = targetRaw.map((segment) => [...segment]);

  if (source.length > 1 && target.length > source.length) {
    const srcBounds = rawPathBounds(source);
    const dstBounds = rawPathBounds(target);
    return {
      mode: "crossfade",
      source,
      sourceEnd: mapRawToBounds(source, srcBounds, dstBounds),
      targetStart: mapRawToBounds(target, dstBounds, srcBounds),
      target,
      aligned: true,
    };
  }

  if (source.length === 1 && target.length === 2) {
    if (signedArea(source[0]) * signedArea(target[0]) < 0) {
      source[0] = reverseSegment(source[0]);
    }
    const [alignedSrc, alignedDst] = alignSubpathPair(source[0], target[0]);
    source[0] = alignedSrc;
    target[0] = alignedDst;
    const outer = rawPathBounds([source[0]]);
    const cx = (outer.minX + outer.maxX) / 2;
    const cy = (outer.minY + outer.maxY) / 2;
    source.push(collapseSegmentToPoint(target[1], cx, cy));
    return { mode: "morph", source, target, aligned: true };
  }

  let aligned = false;
  const shared = Math.min(source.length, target.length);
  for (let i = 0; i < shared; i++) {
    const windingMismatch = signedArea(source[i]) * signedArea(target[i]) < 0;
    if (windingMismatch) {
      source[i] = reverseSegment(source[i]);
      const [alignedSrc, alignedDst] = alignSubpathPair(source[i], target[i]);
      source[i] = alignedSrc;
      target[i] = alignedDst;
      aligned = true;
    }
  }
  return { mode: "morph", source, target, aligned };
}
