/*
 * The spread the About page's text moves by: a mask whose edge sweeps one way as the
 * text slides a little along it. Nothing fades.
 */

/** A line's mask, open: wide enough for its stacked accents and the drawn letters. */
export const OPEN = "inset(-70% -10% -45% -10%)";
/** The mask shut against one side of the line: what shows grows from that side. */
export const SHUT = {
  top: "inset(-70% -10% 170% -10%)",
  bottom: "inset(145% -10% -45% -10%)",
  left: "inset(-70% 110% -45% -10%)",
  right: "inset(-70% -10% -45% 110%)",
};

/**
 * The ways a line moves: which way, the mask it shows from as it comes in that way
 * (its edge sweeping ahead), and the mask it goes into as it leaves that way (what
 * shows shrinking into its far end).
 */
export type Way = { x: number; y: number; from: string; into: string };
export const LEFT: Way = { x: -1, y: 0, from: SHUT.right, into: SHUT.left };
export const RIGHT: Way = { x: 1, y: 0, from: SHUT.left, into: SHUT.right };
export const DOWN: Way = { x: 0, y: 1, from: SHUT.top, into: SHUT.bottom };
export const UP: Way = { x: 0, y: -1, from: SHUT.bottom, into: SHUT.top };

/**
 * Tighter masks, for a block of text going up or down: a paragraph has room enough
 * for its accents, and a heading line's wide margin would leave a long empty start
 * to its spread.
 */
export const TIGHT_OPEN = "inset(-5% -2% -5% -2%)";
export const TIGHT_DOWN: Way = {
  ...DOWN,
  from: "inset(-5% -2% 105% -2%)",
  into: "inset(105% -2% -5% -2%)",
};
export const TIGHT_UP: Way = {
  ...UP,
  from: TIGHT_DOWN.into,
  into: TIGHT_DOWN.from,
};
