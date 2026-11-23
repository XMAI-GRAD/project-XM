"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "./edge";
import { OVERSHOOT_EASE } from "./timing";
import { CLEAR_WORD, homeEnter, gsap, HOVER, MOTION, useGSAP } from "./gsap";

/** Hidden to the right of the left edge → fully shown; the vertical slack keeps
 *  accents and the thin "+" uncut, since the text box is trimmed to its capitals. */
const HIDDEN = "inset(-40% 100% -40% 0%)";
const SHOWN = "inset(-40% -10% -40% 0%)";

/** Between two lines of the title setting off, and between two words of a line. */
const LINE_GAP = 0.3;
const WORD_GAP = 0.05;
/** How far a line of the title travels in from the side, in comp units. */
const WEAVE = 140;
/** How far a hovered accent phrase lifts, as a share of its words' height. */
const LIFT = -10;

/** Shown → wiped away from the left; the vertical slack covers the accents. */
const COVERED = "inset(-50% 0% -50% 0%)";
const UNCOVERED = "inset(-50% 0% -50% 100%)";

/**
 * The ink sweep for a stressed word: the word first shows in the title's navy, then
 * its accent colour paints over it from left to right. The word keeps its own colour
 * throughout; a navy copy laid exactly over it is wiped away from the left. Nothing
 * about the word's box changes, so the lines never shift, and the copy is removed
 * when the sweep is done. Returns the copy, for cleanup.
 */
function ink(
  tl: gsap.core.Timeline,
  word: HTMLElement,
  navy: string,
  at: number,
) {
  const cover = document.createElement("span");
  cover.innerHTML = word.innerHTML;
  cover.setAttribute("aria-hidden", "true");
  cover.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.color = "inherit";
  });
  Object.assign(cover.style, {
    position: "absolute",
    inset: "0",
    color: navy,
    pointerEvents: "none",
    clipPath: COVERED,
  });
  word.style.position = "relative";
  word.append(cover);

  tl.to(
    cover,
    {
      clipPath: UNCOVERED,
      duration: 1.3,
      ease: "power2.inOut",
      onComplete: () => {
        cover.remove();
        word.style.removeProperty("position");
      },
    },
    at,
  );
  return cover;
}

/**
 * Heritage, the first time it scrolls into view: "Từ 2019" shows, then the title is
 * woven in: its lines glide in sideways, from the right and the left in turn, each
 * line's words trailing from the side they come from. Its accented words ("di sản",
 * "làng nghề", "sáng tạo") are inked in their colour once they land, and the two
 * paragraphs follow.
 * When the four numbers come into view, each swipes in to the right, its label just
 * after, one number after another in reading order.
 */
export function HeritageMotion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION, (context) => {
        const q = gsap.utils.selector(root);
        const edge = edgeMotion(
          context,
          () => root.current!.getBoundingClientRect().width / 1920,
        );

        const title = q<HTMLElement>("h2")[0];
        const navy = getComputedStyle(title).color;
        const words = q<HTMLElement>("h2 [data-word]");
        const intro = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: homeEnter(root.current),
            once: true,
          },
          defaults: { duration: 1.1, ease: "power2.out" },
        });
        intro.from(q('[data-motion="since"]'), { opacity: 0, x: -16 }, 0);
        // The title's lines, top to bottom: words grouped by the line they sit on.
        const lines = [
          ...words
            .reduce((rows, w) => {
              const top = Math.round(w.offsetTop);
              rows.set(top, [...(rows.get(top) ?? []), w]);
              return rows;
            }, new Map<number, HTMLElement[]>())
            .values(),
        ];
        // One comp unit in px: the section spans the whole 1920-wide board.
        const unit = root.current!.getBoundingClientRect().width / 1920;
        let end = 0;
        const covers: HTMLElement[] = [];
        lines.forEach((line, row) => {
          const fromRight = row % 2 === 0;
          const order = fromRight ? [...line].reverse() : line;
          order.forEach((word, i) => {
            const at = 0.2 + row * LINE_GAP + i * WORD_GAP;
            intro.from(
              word,
              {
                x: (fromRight ? WEAVE : -WEAVE) * unit,
                opacity: 0,
                duration: 1.3,
                ease: "power3.out",
                clearProps: CLEAR_WORD,
              },
              at,
            );
            if (word.dataset.tone)
              covers.push(ink(intro, word, navy, at + 0.8));
            end = Math.max(end, at + 1.3);
          });
        });
        intro.from(
          q('[data-motion="heritage-body"]'),
          { y: 16, opacity: 0, stagger: 0.15, duration: 1.2 },
          end - 0.6,
        );

        // Once played in, "Từ 2019", the title and the paragraphs sink away at the
        // window's foot and rise back, like the footer; the numbers too, once theirs.
        // Once inked, hovering an accented phrase ("di sản", "làng nghề", "sáng
        // tạo": the words of one tone) lifts it a touch, and it settles back as the
        // pointer leaves. Its words then lose their transform (CLEAR_WORD).
        const hover = window.matchMedia(HOVER);
        const off: (() => void)[] = [];
        const phrases = new Map<string, HTMLElement[]>();
        for (const w of words.filter((w) => w.dataset.tone))
          phrases.set(w.dataset.tone!, [
            ...(phrases.get(w.dataset.tone!) ?? []),
            w,
          ]);
        // Hit-tested against where each phrase sits at rest, as one box over its
        // words and the gap between them: a lifted phrase that rises out from under
        // the pointer stays hovered instead of bobbing.
        const restBox = (phrase: HTMLElement[]) => {
          const boxes = phrase.map((w) => {
            const r = w.getBoundingClientRect();
            const y =
              Number(gsap.getProperty(w, "y")) +
              (Number(gsap.getProperty(w, "yPercent")) * r.height) / 100;
            return {
              left: r.left,
              right: r.right,
              top: r.top - y,
              bottom: r.bottom - y,
            };
          });
          return {
            left: Math.min(...boxes.map((b) => b.left)),
            right: Math.max(...boxes.map((b) => b.right)),
            top: Math.min(...boxes.map((b) => b.top)),
            bottom: Math.max(...boxes.map((b) => b.bottom)),
          };
        };
        let lifted: HTMLElement[] | null = null;
        const lift = (phrase: HTMLElement[] | null) => {
          if (phrase === lifted) return;
          if (lifted)
            gsap.to(lifted, {
              yPercent: 0,
              duration: 0.45,
              ease: "power2.out",
              overwrite: true,
              clearProps: CLEAR_WORD,
            });
          lifted = phrase;
          if (phrase)
            gsap.to(phrase, {
              yPercent: LIFT,
              duration: 0.35,
              ease: OVERSHOOT_EASE,
              overwrite: true,
            });
        };
        const move = (e: PointerEvent) => {
          if (!hover.matches) return;
          const under = [...phrases.values()].find((phrase) => {
            const b = restBox(phrase);
            return (
              e.clientX >= b.left &&
              e.clientX <= b.right &&
              e.clientY >= b.top &&
              e.clientY <= b.bottom
            );
          });
          lift(under ?? null);
        };
        const leave = () => lift(null);
        const accent = () => {
          title.addEventListener("pointerover", move);
          title.addEventListener("pointermove", move);
          title.addEventListener("pointerleave", leave);
          off.push(() => {
            title.removeEventListener("pointerover", move);
            title.removeEventListener("pointermove", move);
            title.removeEventListener("pointerleave", leave);
          });
        };

        intro.eventCallback("onComplete", () => {
          edge.add([
            ...q<HTMLElement>('[data-motion="since"]'),
            title,
            ...q<HTMLElement>('[data-motion="heritage-body"]'),
          ]);
          accent();
        });

        const tl = gsap.timeline({
          onComplete: () => edge.add(q<HTMLElement>('[data-motion="number"]')),
          scrollTrigger: {
            trigger: q('[data-motion="numbers"]')[0],
            start: homeEnter(q('[data-motion="numbers"]')[0], 0.8),
            once: true,
          },
          defaults: { duration: 1.4, ease: "power2.out" },
        });

        q('[data-motion="number"]').forEach((item, i) => {
          const [value, label] = item.children;
          const at = i * 0.3;
          tl.fromTo(
            value,
            { clipPath: HIDDEN, x: -40 },
            { clipPath: SHOWN, x: 0, clearProps: "clipPath,transform" },
            at,
          ).fromTo(
            label,
            { clipPath: HIDDEN, x: -20 },
            { clipPath: SHOWN, x: 0, clearProps: "clipPath,transform" },
            at + 0.25,
          );
        });

        return () => {
          off.forEach((f) => f());
          covers.forEach((cover) => {
            cover.parentElement?.style.removeProperty("position");
            cover.remove();
          });
        };
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={className}>
      {children}
    </section>
  );
}
