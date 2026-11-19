import type { CSSProperties, ReactNode } from "react";
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

/** A run of text in one tone (or none), optionally bold, or one drawn letter. */
type Atom = { text: string; tone?: Tone; bold?: boolean } | { glyph: string };

function atoms(line: string): Atom[] {
  const out: Atom[] = [];
  let last = 0;
  for (const m of line.matchAll(mark)) {
    const [whole, name, letters] = m;
    out.push({ text: line.slice(last, m.index) });
    last = m.index + whole.length;
    if (isTone(name)) out.push({ text: letters, tone: name });
    else if (name === "b") out.push({ text: letters, bold: true });
    // Unknown marks fail the build (prerender) instead of shipping a typo.
    else if (glyphs[name]) out.push({ glyph: name });
    else throw new Error(`unknown text mark "{${name}:…}"`);
  }
  out.push({ text: line.slice(last) });
  return out.filter((a) => "glyph" in a || a.text);
}

function draw(atom: Atom, key: string): ReactNode {
  if ("text" in atom) {
    if (atom.bold)
      return (
        <strong key={key} className={atom.tone ? s[atom.tone] : undefined}>
          {atom.text}
        </strong>
      );
    return atom.tone ? (
      <span key={key} className={s[atom.tone]}>
        {atom.text}
      </span>
    ) : (
      <span key={key}>{atom.text}</span>
    );
  }
  const { Art, box, baseline, cap } = glyphs[atom.glyph];
  return (
    <Art
      key={key}
      className={s.glyph}
      style={
        {
          "--h": box.h / cap,
          "--drop": (box.y + box.h - baseline) / cap,
        } as CSSProperties
      }
    />
  );
}

/** Groups a line's atoms into words, splitting text at spaces. */
function words(line: Atom[]): (Atom[] | string)[] {
  const out: (Atom[] | string)[] = [];
  let word: Atom[] = [];
  const end = () => {
    if (word.length) out.push(word);
    word = [];
  };
  for (const atom of line) {
    if ("glyph" in atom) {
      word.push(atom);
      continue;
    }
    for (const piece of atom.text.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) {
        end();
        out.push(" ");
      } else word.push({ ...atom, text: piece });
    }
  }
  end();
  return out;
}

/** The accent tone of a word, if part of it is marked with one. */
const toneOf = (word: Atom[]) =>
  word.find((a): a is { text: string; tone: Tone } => "tone" in a && !!a.tone)
    ?.tone;

function render(text: string, split: boolean): ReactNode[] {
  let wordIndex = 0;
  return text.split("\n").flatMap((line, n, lines) => {
    const parts = atoms(line);
    const drawn = split
      ? words(parts).map((w, i) =>
          typeof w === "string" ? (
            w
          ) : (
            <span
              key={`${n}:${i}`}
              className={s.word}
              data-word={wordIndex++}
              data-tone={toneOf(w)}
            >
              {w.map((atom, j) => draw(atom, `${n}:${i}:${j}`))}
            </span>
          ),
        )
      : parts.map((atom, i) => draw(atom, `${n}:${i}`));
    return n < lines.length - 1 ? [...drawn, <br key={`br${n}`} />] : drawn;
  });
}

/**
 * Text from data/home.yaml with its marks: `{gold:word}` colors a word, `{glyph-…:a}`
 * swaps a letter for the designer's drawing, and a line break breaks the line. With a
 * drawn letter, screen readers get the plain text and the drawing is hidden from them.
 * `split` wraps each word in a `[data-word]` span, numbered from 0, for motion; a
 * word in an accent tone also gets `data-tone`, so motion can stress it.
 */
export function RichText({
  text,
  split = false,
}: {
  text: string;
  split?: boolean;
}) {
  const hasGlyph = [...text.matchAll(mark)].some(
    ([, name]) => !isTone(name) && name !== "b",
  );
  if (!hasGlyph) return <>{render(text, split)}</>;
  return (
    <>
      <span className="sr-only">{plain(text)}</span>
      <span aria-hidden="true">{render(text, split)}</span>
    </>
  );
}
