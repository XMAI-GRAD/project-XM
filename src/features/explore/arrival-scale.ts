export interface Size {
  width: number;
  height: number;
}

export interface ArrivalRect extends Size {
  left: number;
  top: number;
}

export interface ArrivalFrame {
  x: number;
  y: number;
  scale: number;
  insetX: number;
  insetY: number;
  clipPath: string;
  boxWidth: number;
  boxHeight: number;
  expanded: boolean;
}

/**
 * Content-matched initial scale for the gate -> detail hero FLIP.
 * Prefers the destination hero photo's known content dimensions (independent of
 * img decode state) so an unloaded detail image never falls back to the gate
 * cover's aspect ratio and re-zooms once decoded.
 */
export function arrivalScale({
  gateRect,
  heroRect,
  heroPhoto,
  loaded,
  handoff,
}: {
  gateRect: Size;
  heroRect: Size;
  heroPhoto?: Size;
  loaded?: Size;
  handoff?: Size;
}): number {
  const source =
    heroPhoto && heroPhoto.width > 0 && heroPhoto.height > 0
      ? heroPhoto
      : loaded && loaded.width > 0 && loaded.height > 0
        ? loaded
        : handoff && handoff.width > 0 && handoff.height > 0
          ? handoff
          : null;

  if (source) {
    return (
      Math.max(gateRect.width / source.width, gateRect.height / source.height) /
      Math.max(heroRect.width / source.width, heroRect.height / source.height)
    );
  }

  return Math.max(
    gateRect.width / heroRect.width,
    gateRect.height / heroRect.height,
  );
}

/**
 * Computes the uniform transform + symmetric clip-path inset at `progress` ∈ [0, 1]
 * so the visible frame morphs linearly from `gateRect` (~1.11:1) to `heroRect`
 * (~1.62:1) while the inner `object-fit: cover` photo scales uniformly with zero
 * distortion. Computing `clipPath` numerically avoids Chrome's `inset()` shorthand
 * canonicalization (2 values vs 4 values) freezing CSS string interpolation.
 */
export function computeArrivalFrame({
  gateRect,
  heroRect,
  startScale,
  progress,
}: {
  gateRect: ArrivalRect;
  heroRect: ArrivalRect;
  startScale: number;
  progress: number;
}): ArrivalFrame {
  const t = Math.max(0, Math.min(1, progress));
  const boxWidth = Math.max(heroRect.width, gateRect.width / startScale);
  const boxHeight = Math.max(heroRect.height, gateRect.height / startScale);
  const expanded =
    boxWidth > heroRect.width + 0.5 || boxHeight > heroRect.height + 0.5;

  const scale = startScale + (1 - startScale) * t;
  const visibleW = gateRect.width + (heroRect.width - gateRect.width) * t;
  const visibleH = gateRect.height + (heroRect.height - gateRect.height) * t;

  const dx =
    gateRect.left + gateRect.width / 2 - (heroRect.left + heroRect.width / 2);
  const dy =
    gateRect.top + gateRect.height / 2 - (heroRect.top + heroRect.height / 2);
  const x = t === 1 ? 0 : dx * (1 - t);
  const y = t === 1 ? 0 : dy * (1 - t);

  const insetX = Math.max(0, (1 - visibleW / (boxWidth * scale)) / 2) * 100;
  const insetY = Math.max(0, (1 - visibleH / (boxHeight * scale)) / 2) * 100;
  const clipPath = `inset(${insetY.toFixed(3)}% ${insetX.toFixed(3)}%)`;

  return {
    x,
    y,
    scale,
    insetX,
    insetY,
    clipPath,
    boxWidth,
    boxHeight,
    expanded,
  };
}

/**
 * Arrival state for a point page that Cache Components may keep alive
 * (hidden in `<Activity>`) and show again. A fresh gate hand-off always wins and
 * re-arms the flight; without one, the first run settles on `null` and later
 * runs (Strict Mode re-run, Back to a preserved page) keep what they had.
 */
export function resolveArrival<H>(
  state: { arrived: boolean; handoff: H | null | undefined },
  fresh: H | null,
): { arrived: boolean; handoff: H | null } {
  if (fresh) return { arrived: false, handoff: fresh };
  return { arrived: state.arrived, handoff: state.handoff ?? null };
}
