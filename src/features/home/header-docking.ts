/** Total scroll from opening end to header fully out, as a share of viewport height (~5 notches). */
export const DOCK_TOTAL_VH = 0.48;

/**
 * Split the total dock travel into an initial header hold plus the header's own exit height.
 * The logo docks across the full `totalDistance`, overlapping smoothly with the header exit.
 */
export function computeDockLayout({
  viewportHeight,
  headerHeight,
}: {
  viewportHeight: number;
  headerHeight: number;
}): { totalDistance: number; holdDistance: number } {
  const totalDistance = Math.max(
    headerHeight,
    Math.round(viewportHeight * DOCK_TOTAL_VH),
  );
  const holdDistance = Math.max(0, totalDistance - headerHeight);
  return { totalDistance, holdDistance };
}

/**
 * Compute scene hold translation and exact logo counter-offset so the logo stays at
 * its constant viewport-Y slot while the header scrolls out during the overlap.
 */
export function dockHeaderOffset({
  offset,
  holdDistance,
}: {
  offset: number;
  holdDistance: number;
}): { heldScroll: number; headerExit: number; logoFollowY: number } {
  const heldScroll = Math.max(0, Math.min(holdDistance, offset));
  const headerExit = Math.max(0, offset - heldScroll);
  return { heldScroll, headerExit, logoFollowY: headerExit };
}

/** Quadratic ease-in-out (`power2.inOut`) applied to clamped scroll progress across the dock. */
export function dockEaseInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Scroll-scrubbed dock progress (`0..1`) from `offset = scrollY - openingEnd` across `totalDistance`. */
export function dockProgress({
  offset,
  totalDistance,
}: {
  offset: number;
  totalDistance: number;
}): number {
  if (totalDistance <= 0) return offset > 0 ? 1 : 0;
  const linear = Math.max(0, Math.min(1, offset / totalDistance));
  return dockEaseInOut(linear);
}

/**
 * Compute GPU-only `scaleX`/`scaleY` for the logo link and exact inverse scale for
 * the morphing flight SVG so neither `width` nor `height` is ever written during docking.
 */
export function computeDockScale({
  progress,
  width,
  height,
  railWidth,
  railHeight,
}: {
  progress: number;
  width: number;
  height: number;
  railWidth: number;
  railHeight: number;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const targetScaleX = width > 0 ? railWidth / width : 1;
  const targetScaleY = height > 0 ? railHeight / height : 1;
  const scaleX = 1 + (targetScaleX - 1) * p;
  const scaleY = 1 + (targetScaleY - 1) * p;
  return {
    scaleX,
    scaleY,
    flightScaleX: scaleX > 0 ? 1 / scaleX : 1,
    flightScaleY: scaleY > 0 ? 1 / scaleY : 1,
  };
}
