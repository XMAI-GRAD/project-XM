type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Rectangle = { left: number; top: number; right: number; bottom: number };

/** Find room for an anchored label by moving the camera, never the label. */
export function selectedMapView({
  artwork,
  viewport,
  anchor,
  footprint,
  preferred,
  scale,
  maxScale,
  obstacles = [],
  inset = 12,
}: {
  artwork: Size;
  viewport: Size;
  anchor: Point;
  // Screen-space distances from the pin center, including its button and label.
  footprint: Rectangle | ((scale: number) => Rectangle);
  preferred: Point;
  scale: number;
  maxScale: number;
  obstacles?: Rectangle[];
  inset?: number;
}): { center: Point; scale: number } | null {
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const valid = (rect: Rectangle) =>
    rect.right >= rect.left && rect.bottom >= rect.top;
  const subtract = (rect: Rectangle, blocked: Rectangle): Rectangle[] => {
    if (
      blocked.right <= rect.left ||
      blocked.left >= rect.right ||
      blocked.bottom <= rect.top ||
      blocked.top >= rect.bottom
    )
      return [rect];
    return [
      { ...rect, right: Math.min(rect.right, blocked.left) },
      { ...rect, left: Math.max(rect.left, blocked.right) },
      { ...rect, bottom: Math.min(rect.bottom, blocked.top) },
      { ...rect, top: Math.max(rect.top, blocked.bottom) },
    ].filter(valid);
  };
  let candidateScale = Math.max(
    scale,
    viewport.width / artwork.width,
    viewport.height / artwork.height,
  );
  if (candidateScale > maxScale) return null;

  for (;;) {
    // The available label side can change as the artwork is zoomed in.
    const occupied =
      typeof footprint === "function" ? footprint(candidateScale) : footprint;
    // Intersect label-safe pin positions with positions that keep the artwork
    // covering the viewport. These bounds rule out blank strips at every edge.
    let areas: Rectangle[] = [
      {
        left: Math.max(
          inset + occupied.left,
          viewport.width - (artwork.width - anchor.x) * candidateScale,
        ),
        right: Math.min(
          viewport.width - inset - occupied.right,
          anchor.x * candidateScale,
        ),
        top: Math.max(
          inset + occupied.top,
          viewport.height - (artwork.height - anchor.y) * candidateScale,
        ),
        bottom: Math.min(
          viewport.height - inset - occupied.bottom,
          anchor.y * candidateScale,
        ),
      },
    ].filter(valid);
    for (const obstacle of obstacles) {
      const blocked = {
        left: obstacle.left - occupied.right - 8,
        right: obstacle.right + occupied.left + 8,
        top: obstacle.top - occupied.bottom - 8,
        bottom: obstacle.bottom + occupied.top + 8,
      };
      areas = areas.flatMap((area) => subtract(area, blocked));
    }
    const positions = areas.map((area) => ({
      x: clamp(preferred.x, area.left, area.right),
      y: clamp(preferred.y, area.top, area.bottom),
    }));
    positions.sort(
      (a, b) =>
        Math.hypot(a.x - preferred.x, a.y - preferred.y) -
        Math.hypot(b.x - preferred.x, b.y - preferred.y),
    );
    const position = positions[0];
    if (position)
      return {
        center: {
          x: anchor.x + (viewport.width / 2 - position.x) / candidateScale,
          y: anchor.y + (viewport.height / 2 - position.y) / candidateScale,
        },
        scale: candidateScale,
      };
    if (candidateScale === maxScale) return null;
    candidateScale = Math.min(maxScale, candidateScale * 1.125);
  }
}
