import { Fragment, type CSSProperties, type ReactNode } from "react";
import { tones, type Tone } from "@/content";
import { glyphs } from "./glyphs";
import s from "./rich-text.module.css";

const mark = /\{([a-z0-9-]+):([^}]*)\}/g;

/** The text as read aloud: marks reduced to their letters, line breaks to spaces. */
export const plain = (text: string) =>
  text.replace(mark, "$2").replace(/\s*\n\s*/g, " ");

const isTone = (name: string): name is Tone =>
  (tones as readonly string[]).includes(name);

/** The class that colors text in an accent tone (data/home.yaml counts). */
export const toneClass = (tone: Tone) => s[tone];

function render(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, n) => {
    let last = 0;
    for (const m of line.matchAll(mark)) {
      const [whole, name, letters] = m;
      out.push(line.slice(last, m.index));
      last = m.index + whole.length;
      const key = `${n}:${m.index}`;
      if (isTone(name)) {
        out.push(
          <span key={key} className={s[name]}>
            {letters}
          </span>,
        );
        continue;
      }
      const glyph = glyphs[name];
      // Unknown marks fail the build (prerender) instead of shipping a typo.
      if (!glyph) throw new Error(`data/home.yaml: unknown mark "{${name}:…}"`);
      const { Art, box, baseline, cap } = glyph;
      out.push(
        <Art
          key={key}
          className={s.glyph}
          style={
            {
              "--h": box.h / cap,
              "--drop": (box.y + box.h - baseline) / cap,
            } as CSSProperties
          }
        />,
      );
    }
    out.push(line.slice(last));
    if (n < lines.length - 1) out.push(<br key={`br${n}`} />);
  });
  return out.map((part, i) =>
    typeof part === "string" ? <Fragment key={i}>{part}</Fragment> : part,
  );
}

/**
 * Text from data/home.yaml with its marks: `{gold:word}` colors a word, `{glyph-…:a}`
 * swaps a letter for the designer's drawing, and a line break breaks the line. With a
 * drawn letter, screen readers get the plain text and the drawing is hidden from them.
 */
export function RichText({ text }: { text: string }) {
  const hasGlyph = [...text.matchAll(mark)].some(([, name]) => !isTone(name));
  if (!hasGlyph) return <>{render(text)}</>;
  return (
    <>
      <span className="sr-only">{plain(text)}</span>
      <span aria-hidden="true">{render(text)}</span>
    </>
  );
}
