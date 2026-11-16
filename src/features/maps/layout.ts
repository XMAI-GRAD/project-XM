export interface MapPixel {
  x: number;
  y: number;
}

export interface MapRectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A pin's tip, with room above it for its 44px button and focus ring. */
export function mapFocusPoint(
  size: { width: number; height: number },
  card?: MapRectangle,
): MapPixel {
  const insetX = Math.min(32, size.width / 4);
  const area = {
    left: insetX,
    right: size.width - insetX,
    top: Math.min(72, size.height / 3),
    bottom: size.height - Math.min(24, size.height / 6),
  };
  let candidates = [area];
  if (
    card &&
    card.right > area.left &&
    card.left < area.right &&
    card.bottom > area.top &&
    card.top < area.bottom
  ) {
    // Allow for the pin's width, height and focus ring beside the card.
    candidates = [
      { ...area, right: Math.min(area.right, card.left - 40) },
      { ...area, left: Math.max(area.left, card.right + 40) },
      { ...area, bottom: Math.min(area.bottom, card.top - 20) },
      { ...area, top: Math.max(area.top, card.bottom + 72) },
    ].filter((rect) => rect.right > rect.left && rect.bottom > rect.top);
  }
  const available =
    candidates.sort(
      (a, b) =>
        (b.right - b.left) * (b.bottom - b.top) -
        (a.right - a.left) * (a.bottom - a.top),
    )[0] ?? area;
  return {
    x: (available.left + available.right) / 2,
    y: (available.top + available.bottom) / 2,
  };
}

/**
 * Small curated layers don't need clustering. Keep isolated pins in place;
 * spread colliding buttons in screen pixels, preserving their source anchors.
 * Stable IDs make placements independent of content/filter ordering.
 */
export function spreadMapPins(
  pins: (MapPixel & { id: string })[],
  spacing = 64,
): Map<string, MapPixel> {
  const placed = new Map<string, MapPixel>();
  const fits = (candidate: MapPixel) =>
    [...placed.values()].every(
      (other) =>
        Math.hypot(candidate.x - other.x, candidate.y - other.y) >=
        spacing - 0.01,
    );
  const ordered = [...pins].sort((a, b) => a.id.localeCompare(b.id));
  const isolated = (pin: (typeof pins)[number]) =>
    pins.every(
      (other) =>
        other.id === pin.id ||
        Math.hypot(pin.x - other.x, pin.y - other.y) >= spacing,
    );
  // Reserve isolated anchors before placing a nearby group around itself.
  const order = [
    ...ordered.filter(isolated),
    ...ordered.filter((pin) => !isolated(pin)),
  ];
  for (const pin of order) {
    let position: MapPixel = { x: pin.x, y: pin.y };
    // Each occupied position can block only a bounded part of a ring. With
    // at most 12 curated points this also handles identical coordinates.
    search: for (let ring = 1; !fits(position); ring++) {
      const steps = ring * 8;
      for (let step = 0; step < steps; step++) {
        const angle = (step / steps) * Math.PI * 2;
        const candidate = {
          x: pin.x + Math.cos(angle) * spacing * ring,
          y: pin.y + Math.sin(angle) * spacing * ring,
        };
        if (fits(candidate)) {
          position = candidate;
          break search;
        }
      }
    }
    placed.set(pin.id, position);
  }
  return placed;
}
