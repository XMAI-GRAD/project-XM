"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion, SINK } from "@/features/home/motion/edge";
import {
  CLEAR_WORD,
  gsap,
  HOVER,
  MOTION,
  ScrollTrigger,
  useGSAP,
} from "@/features/home/motion/gsap";
import { middle, pourOver } from "./pour";
import { DOWN, LEFT, OPEN, RIGHT, UP, type Way } from "./spread";

/*
 * Tempo, after the home hero's title (src/features/home/motion/hero-motion.tsx): long,
 * soft eases, short travels, no bounce. Nothing fades: every line shows and goes
 * through a mask.
 */
const SPREAD = 1.6; // a line spreading in
const LEAVE = 0.9; // a line's way out
/** How far a line travels as it spreads, in and out, in comp units. */
const TRAVEL = 90;

/**
 * The heading's lines, by their place in it, as the phrases that move together: Hà Nội
 * · gia nhập · hệ thống · thành phố sáng tạo của UNESCO (Hanoi · joins · the UNESCO ·
 * Creative Cities Network).
 */
const PHRASES = [[0], [1], [2, 3], [4, 5, 6]];

/**
 * Which way each phrase moves, around the petal the heading is set around. In, it
 * spreads around it: along the top, Hà Nội and gia nhập to the left; down the left
 * side, hệ thống downwards; along the foot, the last lines to the right. Out, it draws
 * in towards the petal: the top ones down, hệ thống to the right, the last lines up.
 */
const ways: { in: Way; out: Way }[] = [
  { in: LEFT, out: DOWN },
  { in: LEFT, out: DOWN },
  { in: DOWN, out: RIGHT },
  { in: RIGHT, out: UP },
];

/**
 * The petal the heading is set around: it fades in as it grows out from a little
 * smaller to its size; it leaves the way it came, shrinking back as it fades.
 */
const PETAL_SMALL = 0.8;
const PETAL_FADE = 0.8;
const PETAL_ZOOM = 1.6;

/**
 * The words beside the petal (Mạch nối to its right, Giao thoa under it) come out of
 * it the same way, smaller, a beat after the heading, as the petal nears its size:
 * Mạch nối spreading out to the right, Giao thoa down. They leave with the heading,
 * drawn back in towards the petal.
 */
const NOTE_SPREAD = 1.1;
const NOTE_DELAY = 0.7;
const NOTE_TRAVEL = 24;
const noteWays: { in: Way; out: Way }[] = [
  { in: RIGHT, out: LEFT },
  { in: DOWN, out: UP },
];

/**
 * Once the cluster is in, GIỚI THIỆU spreads down towards the violet line under it,
 * the same way, and the line flows down from it to the intro. GIỚI THIỆU and the
 * line come in once, the first time, and stay.
 */
const LABEL_DELAY = 1.2;
const LABEL_SPREAD = 1;
const LABEL_TRAVEL = 40;
/** When the line starts flowing down, from the first arrival, and how long it takes. */
const LINE_AT = 1.7;
const LINE_DRAW = 1.4;
/**
 * The intro has the footer's motion (src/features/home/motion/edge.ts): it sinks
 * away at the window's foot and rises away at its head, and comes back the way the
 * page scrolls. The first time, it comes the footer's way but downwards, on from the
 * line: once the line nears its foot, or once the intro is in the window if it
 * isn't yet, it drops in from above. It is in the window once its top is above this
 * share of it.
 */
const INTRO_OVERLAP = 0.3;
const INTRO_DROP = 1;
const INTRO_IN_SIGHT = 0.9;

/**
 * The heading and its petal leave together once the foot of the last line (của
 * UNESCO) rises above this share of the window, just scrolled past it, and come back
 * together once it is below it again.
 */
const OUT_ABOVE = 0.2;

/**
 * Hovering a phrase with a drawn letter in it (gia nhập, hệ thống, sáng tạo) pours
 * that letter's colour over the rest of the phrase, in a circle growing out from the
 * letter; on two lines (hệ / thống), the same circle reaches the other line as it
 * grows. Off it, the circle shrinks back into the letter. The colour is the one the
 * letter is mostly drawn in.
 */
/** The phrases poured, by their lines' places in the heading. */
const POURED = [[1], [2, 3], [5]];
/**
 * The words beside the petal, by their place: Mạch nối, then Giao thoa. Hovering Mạch
 * nối pours its colour over Hà Nội, the heading's line at CITY, in a circle growing
 * from its middle. Giao thoa is a switch: clicked on, every colour pours at once and
 * stays, hovered or not; clicked again, off, they all drain, the one under the
 * pointer too, until the pointer comes onto it again.
 */
const LINK = 0;
const SWITCH = 1;
const CITY = 0;

/**
 * GIỚI THIỆU's heading. As the page opens, the petal in its middle fades in and grows
 * out to its size, and all the phrases spread in at once from it, each its
 * own way around the petal: the edge of what shows sweeps that way as the line slides
 * a little along it. Scrolling down, just past its last line, all of it goes
 * together: the phrases drawing in towards the petal, the petal shrinking back as it
 * fades. The words beside the petal come out of it after the phrases, and go back
 * into it with them; scrolling back up past there, they all come back as they first
 * arrived. The first time, GIỚI THIỆU then spreads down to its line and the line
 * flows down to the intro, both to stay; the intro drops in from it, and from then
 * on moves like the footer.
 */
export function IntroMotion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, (context) => {
        const section = root.current!;
        const lines = gsap.utils.toArray<HTMLElement>(
          section.querySelectorAll("h1 > span"),
        );
        type Part = {
          lines: HTMLElement[];
          way: { in: Way; out: Way };
          distance: number;
          spread: number;
          delay: number;
        };
        const phrases: Part[] = PHRASES.map((group, i) => ({
          lines: group.map((n) => lines[n]).filter(Boolean),
          way: ways[i],
          distance: TRAVEL,
          spread: SPREAD,
          delay: 0,
        })).filter((p) => p.lines.length);
        const notes: Part[] = gsap.utils
          .toArray<HTMLElement>(
            section.querySelectorAll('[data-motion="about-note"]'),
          )
          .map((note, i) => ({
            lines: [note],
            way: noteWays[i],
            distance: NOTE_TRAVEL,
            spread: NOTE_SPREAD,
            delay: NOTE_DELAY,
          }))
          .filter((p) => p.way);
        const label = section.querySelector<HTMLElement>(
          '[data-motion="about-label"]',
        )!;
        const parts = [...phrases, ...notes];
        const petal = section.querySelector<SVGElement>(
          '[data-art="about-petal"]',
        )!;
        const petalIn = () =>
          gsap
            .timeline()
            .fromTo(
              petal,
              { opacity: 0 },
              {
                opacity: 1,
                duration: PETAL_FADE,
                ease: "sine.out",
                overwrite: true,
              },
              0,
            )
            .fromTo(
              petal,
              { scale: PETAL_SMALL, transformOrigin: "50% 50%" },
              {
                scale: 1,
                duration: PETAL_ZOOM,
                ease: "power3.out",
                clearProps: "transform,opacity",
              },
              0,
            );
        const petalOut = () =>
          gsap.to(petal, {
            scale: PETAL_SMALL,
            opacity: 0,
            transformOrigin: "50% 50%",
            duration: LEAVE,
            ease: "power2.in",
            overwrite: true,
          });
        // How far a part travels a way, in the page's current scale.
        const travel = (p: Part, way: Way) => {
          const step =
            (p.distance * section.getBoundingClientRect().width) / 1920;
          return { x: way.x * step, y: way.y * step };
        };

        const arrive = (p: Part) => {
          const { x, y } = travel(p, p.way.in);
          gsap.fromTo(
            p.lines,
            // Back from leaving, it starts again from where its entrance does.
            { x: -x, y: -y, clipPath: p.way.in.from },
            {
              x: 0,
              y: 0,
              clipPath: OPEN,
              duration: p.spread,
              ease: "sine.inOut",
              delay: p.delay,
              overwrite: true,
              clearProps: `${CLEAR_WORD},clipPath`,
            },
          );
        };
        const leave = (p: Part) => {
          const { x, y } = travel(p, p.way.out);
          // Carried on from where it is, if it is still arriving; a line at rest has
          // no mask to tween from, so it gets the open one.
          p.lines.forEach((l) => {
            if (!l.style.clipPath) gsap.set(l, { clipPath: OPEN });
          });
          gsap.to(p.lines, {
            x,
            y,
            clipPath: p.way.out.into,
            duration: LEAVE,
            ease: "power2.in",
            overwrite: true,
          });
        };

        // Where the foot of the last line is, as laid out (offsets ignore its own
        // motion).
        const last = lines[lines.length - 1];
        const away = () =>
          section.getBoundingClientRect().top +
            last.offsetTop +
            last.offsetHeight <
          window.innerHeight * OUT_ABOVE;

        // All of it in at once: the petal, the phrases spreading around it as it
        // grows, and the words beside it a beat later.
        const enter = () => {
          petalIn();
          parts.forEach(arrive);
        };
        const exit = () => {
          petalOut();
          parts.forEach(leave);
        };

        // The first arrival; if the page opened scrolled past the heading, it waits
        // out of sight, to arrive when it comes back.
        let shown = !away();
        if (shown) enter();
        else {
          gsap.set(petal, { scale: PETAL_SMALL, opacity: 0 });
          parts.forEach((p) =>
            gsap.set(p.lines, {
              ...travel(p, p.way.out),
              clipPath: p.way.out.into,
            }),
          );
        }

        // The line, and the intro at its foot.
        const lineArt = section.querySelector<SVGSVGElement>(
          '[data-art="about-intro-line"]',
        )!;
        const line = lineArt.querySelector("path")!;
        const intro = section.querySelector<HTMLElement>(
          '[data-motion="about-intro"]',
        )!;

        const unit = () => section.getBoundingClientRect().width / 1920;
        const edge = edgeMotion(context, unit);
        // The first time, it drops in once it is in the window, then has the
        // footer's motion.
        let introWaiting = false;
        const checkIntro = () => {
          if (!introWaiting) return;
          const box = intro.getBoundingClientRect();
          const moved = Number(gsap.getProperty(intro, "y"));
          if (
            box.top - moved > window.innerHeight * INTRO_IN_SIGHT ||
            box.bottom - moved < 0
          )
            return;
          introWaiting = false;
          gsap.to(intro, {
            y: 0,
            opacity: 1,
            duration: INTRO_DROP,
            ease: "power3.out",
            onComplete: () => edge.add([intro]),
          });
        };
        const introIn = () => {
          introWaiting = true;
          checkIntro();
        };

        if (shown) {
          // GIỚI THIỆU, once the cluster is in, and its line: both come in once.
          arrive({
            lines: [label],
            way: { in: DOWN, out: DOWN },
            distance: LABEL_TRAVEL,
            spread: LABEL_SPREAD,
            delay: LABEL_DELAY,
          });
          gsap.set(line, { drawSVG: "0% 0%" });
          // Waiting above, to drop in as it first comes.
          gsap.set(intro, { y: -SINK * unit(), opacity: 0 });
          gsap
            .timeline({ delay: LINE_AT })
            .to(line, {
              drawSVG: "0% 100%",
              duration: LINE_DRAW,
              ease: "sine.inOut",
              clearProps: "strokeDasharray,strokeDashoffset",
            })
            .add(introIn, `-=${INTRO_OVERLAP}`);
        } else {
          // Opened past the heading: GIỚI THIỆU and its line in place, the intro
          // where the scroll puts it.
          edge.add([intro], { shown: false });
        }

        // Everything now waits where it arrives from: it can show.
        gsap.set(
          [
            section.querySelector("h1"),
            petal,
            ...notes.flatMap((p) => p.lines),
            label,
            lineArt,
            intro,
          ],
          { visibility: "visible" },
        );

        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: () => {
            checkIntro();
            const now = !away();
            if (now === shown) return;
            shown = now;
            if (shown) enter();
            else exit();
          },
        });
      });

      mm.add(HOVER, () => {
        const section = root.current!;
        const lines = gsap.utils.toArray<HTMLElement>(
          section.querySelectorAll("h1 > span"),
        );
        // The switch, and the pours it holds on.
        let lit = false;
        const pours: ReturnType<typeof pourOver>[] = [];
        const cleanups: (() => void)[] = [
          () => pours.forEach((p) => p.destroy()),
        ];
        const pour = (
          over: HTMLElement[],
          colour: string,
          from: () => { x: number; y: number },
          triggers: HTMLElement[],
        ) =>
          pours.push(
            pourOver({
              over,
              colour,
              from,
              triggers,
              lit: () => lit,
              trim: true,
            }),
          );

        // The phrases with a drawn letter, in its colour, from it.
        POURED.forEach((group) => {
          const own = group.map((n) => lines[n]).filter(Boolean);
          const letter = own
            .map((l) => l.querySelector<SVGSVGElement>("svg"))
            .find(Boolean);
          if (!letter) return;
          // The colour the letter is mostly drawn in.
          const count = new Map<string, number>();
          letter.querySelectorAll("[fill]").forEach((el) => {
            const fill = el.getAttribute("fill")!;
            if (fill !== "none") count.set(fill, (count.get(fill) ?? 0) + 1);
          });
          const colour = [...count].sort((a, b) => b[1] - a[1])[0]?.[0];
          if (colour) pour(own, colour, () => middle(letter), own);
        });

        // Mạch nối pours its own colour over Hà Nội, from its middle.
        const notes = gsap.utils.toArray<HTMLElement>(
          section.querySelectorAll('[data-motion="about-note"]'),
        );
        const link = notes[LINK];
        const city = lines[CITY];
        if (link && city)
          pour([city], getComputedStyle(link).color, () => middle(city), [
            link,
          ]);

        // Giao thoa switches every colour on, and off.
        const toggle = notes[SWITCH];
        if (toggle) {
          const flip = () => {
            lit = !lit;
            pours.forEach((p) => p.check(!lit));
          };
          toggle.style.cursor = "pointer";
          toggle.addEventListener("click", flip);
          cleanups.push(() => {
            toggle.style.removeProperty("cursor");
            toggle.removeEventListener("click", flip);
          });
        }

        return () => cleanups.forEach((c) => c());
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
