"use client";

import { useRef, type ReactNode } from "react";
import { homeEnter, gsap, MOTION, ScrollTrigger, useGSAP } from "./gsap";
import { OVERSHOOT_EASE, REVEAL_CAP } from "./timing";

/*
 * Tempo. Hà Nội không vội: calm eases that settle cleanly, short travels, capped
 * so the brand dock remains the most deliberate move on Home.
 */
const TITLE_PACE = 0.9;
const WORD = 1.1; // each word's entrance (slit words: WORD * 1.4 = 1.54 s)
const WORD_GAP = 0.32 * TITLE_PACE; // between the starts of two words
const ART = 1.5; // each drawing's way into the frame
const ART_GAP = 0.16; // between drawings coming from the same side
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
  // drops down through a slit, the first word's mirror: the mask opens from the top
  // like a blind as the word comes down into place. No fade: what shows is solid.
  [
    { yPercent: -45, clipPath: "inset(-45% -20% 145% -20%)" },
    {
      clipPath: "inset(-45% -20% -40% -20%)",
      ease: "sine.inOut",
      duration: WORD * 1.4,
    },
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

/** A word's mask, open: wide enough for its accents and the drawn letters. */
const OPEN = "inset(-45% -20% -40% -20%)";

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

/** The skyline's way in, each group from its side: [parts, from, start, stagger]. */
const artWays: [string[], gsap.TweenVars, number][] = [
  [fromLeft, { x: -800 }, 0.2],
  [fromRight, { x: 900 }, 0.4],
  [fromBelow, { y: 420 }, 0.6],
];
const WAVE_FROM = { yPercent: 60, clipPath: "inset(100% 0% 0% 0%)" };
const STAR_FROM = { scale: 0, rotation: -90, transformOrigin: "50% 50%" };

/**
 * The hero counts as leaving once its foot (the skyline's base, just above MẠCH NỐI)
 * rises above this share of the window: MẠCH NỐI is then near the middle of it.
 */
const LEAVE_AT = 0.4;
/** The skyline returning, matching its entrance cap. */
const LEAVE = 1.5;
/** The buildings leaving: quicker, so they are gone before they drift far. */
const BUILDINGS_LEAVE = LEAVE * 0.75;
/** The text leaving upward: short and accelerating, fading as it goes. */
const TEXT_OUT = 0.55;
const TEXT_OUT_GAP = 0.08;

/**
 * The hero. Scrolling down into it, each word of the title arrives its own way (a
 * drawn letter unfolds after its word), then the tagline wipes in; at the same time
 * the skyline comes into the frame, from the sides and up from below.
 *
 * Scrolling on down, once MẠCH NỐI below reaches the middle of the window, it leaves:
 * the buildings slide back out the way they came, fading, and the text whooshes up
 * and fades out, bottom line first. The wave stays, as the band between the two.
 * Coming back up past that point, the buildings slide back in and the text arrives
 * again its own way.
 */
export function HeroMotion({
  id,
  className,
  children,
}: {
  id: string;
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
        const words = q<HTMLElement>("h1 [data-word]");
        const tagline = q<HTMLElement>('[data-motion="tagline"]');
        const wave = q('[data-art="hero-wave"]');
        const star = parts(["star"]);
        const entry = homeEnter(root.current, 0.7, true);

        /** The title and tagline arriving, from the start of `tl`. */
        const textIn = (tl: gsap.core.Timeline) => {
          words.forEach((word, i) => {
            const at = i * WORD_GAP;
            const [from, to] = entrances[i % entrances.length];
            // Coming back after leaving, a word starts from where its own entrance
            // does, so undo the exit's lift and fade first.
            tl.fromTo(
              word,
              { yPercent: 0, clipPath: OPEN, opacity: 1, ...from },
              { ...settled, ...to, overwrite: true },
              at,
            );
            const glyph = word.querySelector("svg");
            if (glyph)
              tl.fromTo(
                glyph,
                { scale: 0.4, rotation: -60, opacity: 0 },
                {
                  scale: 1,
                  rotation: 0,
                  opacity: 1,
                  transformOrigin: "50% 60%",
                  duration: WORD,
                  ease: OVERSHOOT_EASE,
                  overwrite: true,
                },
                at + 0.5 * TITLE_PACE,
              );
          });
          return tl.fromTo(
            tagline,
            { clipPath: "inset(-40% 100% -40% 0%)", yPercent: 0, opacity: 1 },
            {
              clipPath: "inset(-40% 0% -40% 0%)",
              duration: REVEAL_CAP,
              ease: "sine.inOut",
              clearProps: "clipPath,transform,opacity",
              overwrite: true,
            },
            "-=0.8",
          );
        };

        /** The text whooshing up and fading out, bottom line first. */
        const textOut = () =>
          gsap.to([...tagline, ...[...words].reverse()], {
            yPercent: -70,
            opacity: 0,
            duration: TEXT_OUT,
            ease: "power3.in",
            stagger: TEXT_OUT_GAP,
            overwrite: true,
          });

        // The first arrival: text and skyline together, in time.
        const first = textIn(
          gsap.timeline({
            paused: true,
            defaults: { duration: WORD, ease: SOFT },
          }),
        );
        first.addLabel("art", 0).from(
          wave,
          {
            ...WAVE_FROM,
            duration: REVEAL_CAP,
            clearProps: "transform,clipPath",
          },
          "art",
        );
        for (const [names, from, start] of artWays)
          first.from(
            parts(names),
            { ...from, duration: ART, ease: SOFT, stagger: ART_GAP },
            `art+=${start}`,
          );
        first.from(
          star,
          { ...STAR_FROM, duration: 1.5, ease: OVERSHOOT_EASE },
          "art+=0.9",
        );

        // The skyline leaving all together, the buildings fading as they slide; and
        // returning in the entrance's manner, the groups in turn, each piece a beat
        // apart, fading back in. The wave stays: once in, it is the band between the
        // hero and MẠCH NỐI.
        const artMove = (out: boolean) => {
          const tl = gsap.timeline({
            defaults: { ease: SOFT, overwrite: true },
          });
          for (const [names, from, start] of artWays)
            tl.to(
              parts(names),
              {
                ...(out ? { ...from, opacity: 0 } : { x: 0, y: 0, opacity: 1 }),
                duration: out ? BUILDINGS_LEAVE : LEAVE,
                // Out, everything goes at once; back in, in the entrance's turns.
                stagger: out ? 0 : ART_GAP,
              },
              out ? 0 : start,
            );
          tl.to(
            star,
            out
              ? { ...STAR_FROM, duration: 1.5 }
              : { scale: 1, rotation: 0, duration: 1.5, ease: OVERSHOOT_EASE },
            out ? 0 : 0.7,
          );
        };

        // Where the hero is, read from the page as it is: the header holds the page
        // still for a while after the opening, so a scroll position wouldn't do.
        let state: "arriving" | "in" | "out" = "arriving";
        const check = () => {
          if (state === "arriving") return;
          const leaving =
            root.current!.getBoundingClientRect().bottom <
            window.innerHeight * LEAVE_AT;
          if (leaving && state === "in") {
            state = "out";
            artMove(true);
            textOut();
          } else if (!leaving && state === "out") {
            state = "in";
            artMove(false);
            textIn(gsap.timeline({ defaults: { duration: WORD, ease: SOFT } }));
          }
        };

        ScrollTrigger.create({
          trigger: root.current,
          start: entry,
          once: true,
          onEnter: () =>
            first
              .eventCallback("onComplete", () => {
                state = "in";
                check();
              })
              .play(),
        });
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: check });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} tabIndex={-1} className={className}>
      {children}
    </section>
  );
}
