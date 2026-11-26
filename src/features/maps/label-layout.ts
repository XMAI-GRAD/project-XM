export interface LabelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
export function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}
/** Conservative rotated bounds keep text from covering pins, cards or other names. */
export function labelBox(
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
): LabelBox {
  const radians = (angle * Math.PI) / 180;
  const w =
    Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const h =
    Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
  return {
    left: x - w / 2 - 3,
    right: x + w / 2 + 3,
    top: y - h / 2 - 3,
    bottom: y + h / 2 + 3,
  };
}
export function fitsLabel(
  box: LabelBox,
  viewport: { x: number; y: number },
  occupied: LabelBox[],
) {
  return (
    box.left >= 8 &&
    box.top >= 8 &&
    box.right <= viewport.x - 8 &&
    box.bottom <= viewport.y - 8 &&
    !occupied.some((other) => boxesOverlap(box, other))
  );
}
