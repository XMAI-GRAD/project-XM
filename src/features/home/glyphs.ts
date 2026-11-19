import { pieces as placePieces } from "@/features/explore/art";
import { pieces, type ArtBox, type ArtComponent } from "./art";

/**
 * A drawing set inline in a line of text: a letter the designer drew, or an icon
 * between words. `baseline` and `cap` are that line's baseline and cap height in the
 * comp, so the drawing keeps its size and height against the font's capitals at any
 * font size.
 */
export interface Glyph {
  Art: ArtComponent;
  box: ArtBox;
  baseline: number;
  cap: number;
}

/** Each drawing's line in the comp: its baseline and cap height. */
const lines: Record<string, { baseline: number; cap: number }> = {};
const on = (baseline: number, cap: number, names: string[]) =>
  names.forEach((name) => (lines[name] = { baseline, cap }));

// Home (WEB-02)
on(523, 111, ["glyph-hero-o", "glyph-hero-a"]);
on(1260, 51, ["glyph-thread-i", "glyph-thread-a"]);
on(4592, 72, ["glyph-layers-a", "glyph-layers-o"]);
// About (WEB-05): the heading, then the four lines of fields.
on(532, 67, ["glyph-about-i"]);
on(599, 67, ["glyph-about-e"]);
on(918, 67, ["glyph-about-a"]);
on(2465, 87, ["field-roof", "field-weave", "field-star"]);
on(2590, 87, ["field-tiers", "field-arch"]);
on(2715, 87, ["field-spark", "field-line"]);
on(2840, 87, ["field-gate", "field-tiers-2", "field-wave"]);
// Places (ĐỊA comps)
on(485, 56, ["dia-a-grave", "dia-a-breve", "dia-a-circ"]);
on(554, 56, ["dia-o"]);

const allPieces = { ...pieces, ...placePieces };

export const glyphs: Record<string, Glyph> = Object.fromEntries(
  Object.entries(lines).map(([name, line]) => {
    const piece = allPieces[name];
    if (!piece) throw new Error(`glyphs: no art piece "${name}"`);
    return [name, { ...piece, ...line }];
  }),
);
