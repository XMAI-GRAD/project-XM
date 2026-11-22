"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "@/features/home/motion/edge";
import {
  gsap,
  MOTION,
  ScrollTrigger,
  useGSAP,
} from "@/features/home/motion/gsap";
import {
  DOWN,
  OPEN,
  TIGHT_DOWN,
  TIGHT_OPEN,
  TIGHT_UP,
  type Way,
} from "./spread";

/**
 * Mốc thời gian. Once its label is in the window (above IN_AT of it), the label
 * spreads down and the winding line runs from 2019 on to 2025, a stretch at a time:
 * it slows right down as it reaches each year, holds there a moment, and picks up
 * again on the way to the next.
 * Each year shows as the line reaches it, everything coming in up or down, never
 * from the side, each in turn a different way: its shape opens out from its middle,
 * opens from its middle line, or drops in; its year slides in as it shows, up into
 * its shape or, with none, down; its text
 * spreads away from the year, slides in, or shows where it is. Then every part has
 * the footer's motion (src/features/home/motion/edge.ts), out and back in.
 */
const IN_AT = 0.8;
const LINE_AT = 0.3; // after the label starts
/** The line's whole run; a stretch takes its share, but never less than STRETCH. */
const LINE_RUN = 5.5;
const STRETCH = 0.5;
/** The hold at each year, and how hard the line eases into and out of it. */
const HOLD = 0.2;
const PACE = "power3.inOut";
/** Everything here played this much slower than the times above. */
const SLOWER = 1.15;
/** How long before the line reaches a year it starts to show. */
const AHEAD = 0.15;
const SPREAD = 1.1;
const SHOW = 0.9; // sliding or showing in
const TRAVEL = 20; // comp units
const OPEN_SHAPE = 0.9;
const TEXT_AFTER = 0.2;

export function TimelineMotion({
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
        const section = root.current!;
        const unit = () => section.getBoundingClientRect().width / 1920;
        const label = section.querySelector("h2")!;
        const lineArt = section.querySelector<SVGSVGElement>(
          '[data-art="about-timeline-line"]',
        )!;
        const line = lineArt.querySelector("path")!;
        const years = gsap.utils
          .toArray<HTMLElement>(section.querySelectorAll("ol > li"))
          .map((li) => ({
            shape: li.querySelector<SVGSVGElement>(":scope > svg"),
            year: li.querySelector("span")!,
            body: li.querySelector("p")!,
          }));

        // Where along the line (0 at its start, by 2025) each year is: the point of
        // the line nearest its shape, or its year.
        const length = line.getTotalLength();
        const toLine = lineArt.getScreenCTM()!.inverse();
        const samples = Array.from({ length: 201 }, (_, i) =>
          line.getPointAtLength((length * i) / 200),
        );
        const along = (el: Element) => {
          const box = el.getBoundingClientRect();
          const p = new DOMPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          ).matrixTransform(toLine);
          let best = 0;
          samples.forEach((s, i) => {
            const b = samples[best];
            if (
              Math.hypot(s.x - p.x, s.y - p.y) <
              Math.hypot(b.x - p.x, b.y - p.y)
            )
              best = i;
          });
          return best / 200;
        };

        const play = gsap.timeline({ paused: true }).timeScale(1 / SLOWER);
        const shift = () => TRAVEL * unit();
        const spread = (el: Element, way: Way, at: number, open = TIGHT_OPEN) =>
          play.fromTo(
            el,
            { y: () => -way.y * shift(), clipPath: way.from },
            {
              y: 0,
              clipPath: open,
              duration: SPREAD,
              ease: "sine.inOut",
              // A tight mask left on would crop the accents over the first line.
              clearProps: "clipPath",
            },
            at,
          );
        // Slides in from below (up) or above (down) as it shows.
        const slide = (el: Element, up: boolean, at: number) =>
          play.fromTo(
            el,
            { y: () => (up ? 1 : -1) * shift(), opacity: 0 },
            { y: 0, opacity: 1, duration: SHOW, ease: "power2.out" },
            at,
          );
        const show = (el: Element, at: number) =>
          play.fromTo(
            el,
            { opacity: 0 },
            { opacity: 1, duration: SHOW, ease: "sine.inOut" },
            at,
          );
        // The ways a shape comes in, one year after another.
        const shapeIn = [
          (el: Element, at: number) =>
            play.fromTo(
              el,
              { scale: 0, transformOrigin: "50% 50%" },
              { scale: 1, duration: OPEN_SHAPE, ease: "power3.out" },
              at,
            ),
          (el: Element, at: number) =>
            play.fromTo(
              el,
              { scaleY: 0, transformOrigin: "50% 50%" },
              { scaleY: 1, duration: OPEN_SHAPE, ease: "power3.out" },
              at,
            ),
          (el: Element, at: number) => slide(el, false, at),
        ];
        // The ways a year's text comes in, away from its year: down if set under
        // it, up if over it.
        const textIn = [
          (el: Element, under: boolean, at: number) =>
            spread(el, under ? TIGHT_DOWN : TIGHT_UP, at),
          (el: Element, under: boolean, at: number) => slide(el, !under, at),
          (el: Element, _under: boolean, at: number) => show(el, at),
        ];

        spread(label, DOWN, 0, OPEN);

        // The line runs from its far end, by 2019, back to its start, stopping by
        // each year: from one to the next it picks up and eases off again.
        const stops = years.map(({ shape, year }) => along(shape ?? year));
        const marks = [...new Set([1, ...stops, 0])].sort((a, b) => b - a);
        const reach = new Map<number, number>([[1, LINE_AT]]);
        marks.slice(1).forEach((to, i) => {
          const from = marks[i];
          const start = reach.get(from)!;
          const duration = Math.max(STRETCH, (from - to) * LINE_RUN);
          play.fromTo(
            line,
            { drawSVG: `${from * 100}% 100%` },
            {
              drawSVG: `${to * 100}% 100%`,
              duration,
              ease: PACE,
              immediateRender: i === 0,
            },
            start,
          );
          reach.set(to, start + duration + HOLD);
        });

        years.forEach(({ shape, year, body }, i) => {
          // As the line reaches it: before its hold.
          const at = Math.max(0, reach.get(stops[i])! - HOLD - AHEAD);
          if (shape) shapeIn[i % shapeIn.length](shape, at);
          // A year on a shape slides up into it; one on its own (2021, 2024) down.
          slide(year, !!shape, at + (shape ? TEXT_AFTER : 0));
          const under = body.offsetTop > year.offsetTop;
          textIn[i % textIn.length](body, under, at + TEXT_AFTER);
        });

        // Once in, every part moves like the footer.
        const edge = edgeMotion(context, unit);
        play.eventCallback("onComplete", () =>
          edge.add([
            label,
            lineArt,
            ...years.flatMap(({ shape, year, body }) => [
              ...(shape ? [shape] : []),
              year,
              body,
            ]),
          ]),
        );

        // Everything now waits where it arrives from: it can show.
        gsap.set([label, lineArt, ...section.querySelectorAll("ol > li")], {
          visibility: "visible",
        });

        const check = () => {
          if (play.progress() > 0) return;
          const top = section.getBoundingClientRect().top + label.offsetTop;
          if (top < window.innerHeight * IN_AT) play.play();
        };
        check();
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: check });
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
