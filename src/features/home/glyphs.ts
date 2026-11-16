import {
  GlyphHeroA,
  glyphHeroABox,
  GlyphHeroO,
  glyphHeroOBox,
  GlyphLayersA,
  glyphLayersABox,
  GlyphLayersO,
  glyphLayersOBox,
  GlyphThreadA,
  glyphThreadABox,
  GlyphThreadI,
  glyphThreadIBox,
  type ArtBox,
  type ArtComponent,
} from "./art";

/**
 * A letter the designer drew, set inline in a heading. `baseline` and `cap` are the
 * heading's baseline and cap height in the comp, so the drawing keeps its size and
 * height against the font's capitals at any font size.
 */
export interface Glyph {
  Art: ArtComponent;
  box: ArtBox;
  baseline: number;
  cap: number;
}

const hero = { baseline: 523, cap: 111 };
const thread = { baseline: 1260, cap: 51 };
const layers = { baseline: 4592, cap: 72 };

export const glyphs: Record<string, Glyph> = {
  "glyph-hero-o": { Art: GlyphHeroO, box: glyphHeroOBox, ...hero },
  "glyph-hero-a": { Art: GlyphHeroA, box: glyphHeroABox, ...hero },
  "glyph-thread-i": { Art: GlyphThreadI, box: glyphThreadIBox, ...thread },
  "glyph-thread-a": { Art: GlyphThreadA, box: glyphThreadABox, ...thread },
  "glyph-layers-a": { Art: GlyphLayersA, box: glyphLayersABox, ...layers },
  "glyph-layers-o": { Art: GlyphLayersO, box: glyphLayersOBox, ...layers },
};
