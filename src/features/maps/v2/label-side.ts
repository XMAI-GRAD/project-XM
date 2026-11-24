type Size = { width: number; height: number };
type Point = { x: number; y: number };

/** Use the full artwork, not the visible map frame. Pan never changes the side. */
export function artworkLabelLayout({
  artwork,
  anchor,
  label,
  scale,
}: {
  artwork: Size;
  anchor: Point;
  label: Size;
  scale: number;
}) {
  // The Leaflet marker has a 44px button. Match the CSS side/below gap of 4px.
  const radius = 22;
  const offset = radius + 4;
  // Label rectangles relative to the pin center, in preference order.
  const candidates = [
    {
      side: "above",
      left: -label.width / 2,
      top: -radius - label.height,
    },
    { side: "right", left: offset, top: -label.height / 2 },
    { side: "left", left: -offset - label.width, top: -label.height / 2 },
    { side: "below", left: -label.width / 2, top: offset },
  ] as const;
  const layouts = candidates.map((candidate) => {
    const left = anchor.x * scale + candidate.left;
    const top = anchor.y * scale + candidate.top;
    const right = left + label.width;
    const bottom = top + label.height;
    const visibleWidth = Math.max(
      0,
      Math.min(right, artwork.width * scale) - Math.max(left, 0),
    );
    const visibleHeight = Math.max(
      0,
      Math.min(bottom, artwork.height * scale) - Math.max(top, 0),
    );
    return {
      ...candidate,
      fits:
        left >= 0 &&
        top >= 0 &&
        right <= artwork.width * scale &&
        bottom <= artwork.height * scale,
      visibleArea: visibleWidth * visibleHeight,
    };
  });
  // If none fit, keep the most readable anchored position without sliding it.
  // Selection can still zoom/pan for room; the details card remains available.
  const chosen =
    layouts.find((layout) => layout.fits) ??
    layouts.reduce((best, layout) =>
      layout.visibleArea > best.visibleArea ? layout : best,
    );
  return {
    side: chosen.side,
    footprint: {
      left: Math.max(radius, -chosen.left),
      right: Math.max(radius, chosen.left + label.width),
      top: Math.max(radius, -chosen.top),
      bottom: Math.max(radius, chosen.top + label.height),
    },
  };
}
