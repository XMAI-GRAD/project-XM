/** Opening scroll distance as a multiple of one viewport height (0.7 = 70% of 100svh). */
export const OPENING_SCROLL_VH = 0.7;

/** Shared document-Y end of the opening transition (0.7*vh under motion, 1.0*vh under reduce). */
export function openingTransitionEnd(
  openingBottom: number,
  scrollY: number,
): number {
  return Math.max(0, Math.ceil(openingBottom + scrollY));
}

/** Pure opening distance and offset geometry decoupled from the 100svh visual opening. */
export function computeOpeningGeometry({
  viewportHeight,
  scrollVh,
  wordmarkEnd,
  progress,
}: {
  viewportHeight: number;
  scrollVh: number;
  wordmarkEnd: number;
  progress: number;
}) {
  const visualHeight = viewportHeight;
  const distance = viewportHeight * scrollVh;
  const p = Math.max(0, Math.min(1, progress));
  const remainingScroll = distance * (1 - wordmarkEnd);
  const movingLettersY =
    p <= wordmarkEnd
      ? -(p / wordmarkEnd) * remainingScroll
      : -remainingScroll * (1 - (p - wordmarkEnd) / (1 - wordmarkEnd));

  return {
    visualHeight,
    distance,
    boardY: -distance * (1 - p) + 0,
    backdropY: distance * p + 0,
    movingLettersY: movingLettersY + 0,
  };
}
