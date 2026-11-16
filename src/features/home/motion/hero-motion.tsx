"use client";

import { useRef, type ReactNode } from "react";
import { ENTER, gsap, MOTION, useGSAP } from "./gsap";

/*
 * Tempo. Hà Nội không vội: long, soft eases that settle slowly, short travels, no
 * bounce. Tune the whole hero from here.
 */
const WORD = 1.8; // each word's entrance
const WORD_GAP = 0.4; // between the starts of two words
const ART = 3; // each drawing's way into the frame
const ART_GAP = 0.25; // between drawings coming from the same side
const SOFT = "power2.out";

/** How each word of the title arrives, in turn: from → to. */
const entrances: [gsap.TweenVars, gsap.TweenVars][] = [
  // rises through a slit. The reveal runs from the baseline to just above the accents
  // (the box is trimmed to the capitals), on an even ease and a longer time: with the
  // shared ease the slit opened in a rush and this word read faster than the rest.
  [
    { yPercent: 45, clipPath: "inset(100% -20% -40% -20%)" },
    {
      clipPath: "inset(-45% -20% -40% -20%)",
      ease: "sine.inOut",
      duration: WORD * 1.4,
    },
  ],
  // drifts in from the left, out of a blur
  [
    { xPercent: -25, skewX: -10, opacity: 0, filter: "blur(8px)" },
    { filter: "blur(0px)" },
  ],
  // settles down from above
  [{ yPercent: -60, opacity: 0 }, {}],
  // tips up off its baseline
  [
    {
      rotationX: -70,
      transformPerspective: 900,
      transformOrigin: "50% 100%",
      opacity: 0,
    },
    {},
  ],
];

const settled = {
  xPercent: 0,
  yPercent: 0,
  skewX: 0,
  rotationX: 0,
  opacity: 1,
  clearProps: "transform,opacity,filter,clipPath",
};

/** Which way each group of the skyline comes into the frame. */
const fromLeft = [
  "left-petal-high",
  "left-petal-low",
  "left-roof",
  "left-house",
];
const fromRight = ["right-hill", "right-roof"];
const fromBelow = ["center-roof", "center-gate", "center-crown"];

/**
 * The hero, the first time it scrolls into view: each word of the title arrives its
 * own way (a drawn letter unfolds after its word), then the tagline wipes in. At the
 * same time the skyline comes into the frame — from the sides, and up from below.
 */
export function HeroMotion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION, () => {
        const q = gsap.utils.selector(root);
        const parts = (names: string[]) =>
          names.flatMap((n) =>
            q(`[data-art="hero-skyline"] [data-part="${n}"]`),
          );
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: ENTER, once: true },
          defaults: { duration: WORD, ease: SOFT },
        });

        q("h1 [data-word]").forEach((word, i) => {
          const at = i * WORD_GAP;
          const [from, to] = entrances[i % entrances.length];
          tl.fromTo(word, from, { ...settled, ...to }, at);
          const glyph = word.querySelector("svg");
          if (glyph)
            tl.from(
              glyph,
              {
                scale: 0.4,
                rotation: -60,
                opacity: 0,
                transformOrigin: "50% 60%",
                duration: WORD,
                ease: "back.out(1.2)",
              },
              at + 0.5,
            );
        });

        tl.fromTo(
          q('[data-motion="tagline"]'),
          { clipPath: "inset(-40% 100% -40% 0%)" },
          {
            clipPath: "inset(-40% 0% -40% 0%)",
            duration: 2,
            ease: "sine.inOut",
            clearProps: "clipPath",
          },
          "-=1",
        );

        // The skyline starts with the first word, not after the text.
        tl.addLabel("art", 0)
          .fromTo(
            q('[data-art="hero-wave"]'),
            { yPercent: 60, clipPath: "inset(100% 0% 0% 0%)" },
            {
              yPercent: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 2,
              clearProps: "transform,clipPath",
            },
            "art",
          )
          .from(
            parts(fromLeft),
            { x: -800, duration: ART, ease: SOFT, stagger: ART_GAP },
            "art+=0.2",
          )
          .from(
            parts(fromRight),
            { x: 900, duration: ART, ease: SOFT, stagger: ART_GAP },
            "art+=0.4",
          )
          .from(
            parts(fromBelow),
            { y: 420, duration: ART, ease: SOFT, stagger: ART_GAP },
            "art+=0.6",
          )
          .from(
            parts(["star"]),
            {
              scale: 0,
              rotation: -90,
              transformOrigin: "50% 50%",
              duration: 2.4,
              ease: "back.out(1.1)",
            },
            "art+=1.6",
          );
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
