"use client";

import { gsap, ScrollTrigger } from "./gsap";
import { SCRUB_SMOOTH } from "./timing";

/** How far an element sinks as it nears the window's foot, or rises as it nears
 *  its head, in comp units: the footer's rise (src/components/footer-motion.tsx). */
export const SINK = 120;
/** Where in the window it sinks through, by its top, as shares of the window's
 *  height from the top: settled above 75%, gone below 95%. Close to the edges, so a
 *  section that fills the window shows whole; only what is leaving it moves out. */
const SHOWN_AT = 0.75;
const GONE_AT = 0.95;
/** Where it rises away through, by its bottom: settled below 10%, gone at the top. */
const SHOWN_ABOVE = 0.1;
const GONE_ABOVE = 0;
/** Seconds it takes to catch up with the scroll, so it glides. */
const SMOOTH = SCRUB_SMOOTH;

type Edge = {
  el: HTMLElement | SVGElement;
  /** What is measured for where it sits: the element, or a part of it. */
  ref: Element;
  /** How much later than the others it settles, in bands (the footer's columns). */
  lag: number;
  /** 0 sunk below, 1 in place, 2 risen away above: its timeline at half that. */
  move: gsap.core.Timeline;
  glide: gsap.QuickToFunc;
  target: number;
  /** Whether it moves yet: one handed over from its entrance waits until the
   *  scroll would show it whole, so it doesn't sink as soon as it has played in. */
  armed: boolean;
};

/**
 * The footer's motion, for the rest of the page once it has played in: whatever
 * comes near the foot of the window sinks down and fades away there, and rises back
 * into place as it scrolls up again. Scrolling up the page, the text and buttons
 * below drop out of sight one after another; scrolling down, they come up. Leaving
 * by the head of the window, they rise on and fade away, and drop back into place
 * on the way back: whichever way the page scrolls, what leaves the window moves out.
 *
 * Tied to where each element sits on screen (the header's hold shifts the page after
 * the opening, so scroll positions wouldn't do), and smoothed, like the footer's scrub.
 * Only opacity moves, never visibility, so links stay reachable by keyboard.
 *
 * `context` is the motion's matchMedia context, so elements added later (once their
 * entrance is over) are reverted with it.
 */
export function edgeMotion(context: gsap.Context, unit: () => number) {
  const edges: Edge[] = [];

  const progress = (edge: Edge) => {
    const vh = window.innerHeight;
    // Where it sits at rest: its motion moves what is measured too (the element's
    // own, or the measured element's when that is another one, moving the same way).
    const rect = edge.ref.getBoundingClientRect();
    const moved = Number(
      gsap.getProperty(edge.el.contains(edge.ref) ? edge.el : edge.ref, "y"),
    );
    const top = rect.top - moved;
    const bottom = rect.bottom - moved;
    const below = gsap.utils.clamp(
      0,
      1,
      (GONE_AT * vh - top) / ((GONE_AT - SHOWN_AT) * vh) - edge.lag,
    );
    if (below < 1) return below;
    const above = gsap.utils.clamp(
      0,
      1,
      (bottom - GONE_ABOVE * vh) / ((SHOWN_ABOVE - GONE_ABOVE) * vh) - edge.lag,
    );
    return 2 - above;
  };
  const update = () =>
    edges.forEach((edge) => {
      const p = progress(edge);
      if (!edge.armed) {
        if (Math.abs(p - 1) > 0.001) return;
        edge.armed = true;
      }
      if (Math.abs(p - edge.target) < 0.001) return;
      edge.target = p;
      edge.glide(p);
    });

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: update,
    onRefresh: () => {
      edges.forEach((edge) => edge.move.invalidate());
      update();
    },
  });

  return {
    /**
     * Gives the elements the motion. Elements still to play their entrance must be
     * added once it is over: they start shown, and move once the scroll would show
     * them whole. Elements without one start right where the scroll puts them.
     */
    add(
      targets: (
        | HTMLElement
        | SVGElement
        | { el: HTMLElement | SVGElement; ref: Element }
      )[],
      { lag = 0, shown = true }: { lag?: number; shown?: boolean } = {},
    ) {
      context.add(() => {
        targets.forEach((target, i) => {
          const { el, ref } =
            target instanceof Element ? { el: target, ref: target } : target;
          const move = gsap
            .timeline({ paused: true, defaults: { immediateRender: false } })
            .fromTo(
              el,
              { y: () => SINK * unit(), opacity: 0 },
              { y: 0, opacity: 1, ease: "power2.out" },
            )
            .fromTo(
              el,
              { y: 0, opacity: 1 },
              { y: () => -SINK * unit(), opacity: 0, ease: "power2.in" },
            );
          const edge: Edge = {
            el,
            ref,
            lag: lag * i,
            move,
            glide: undefined!,
            target: 1,
            armed: !shown,
          };
          // An element without an entrance to hand over from starts right where the
          // scroll puts it.
          if (!shown) {
            edge.target = progress(edge);
            // Rendered by hand: a paused timeline sent to where it already is (0,
            // sunk) draws nothing, and the element would show at rest.
            if (edge.target !== 1) move.progress(1).progress(edge.target / 2);
          }
          const state = { p: edge.target };
          edge.glide = gsap.quickTo(state, "p", {
            duration: SMOOTH,
            ease: "power3.out",
            onUpdate: () => {
              move.progress(state.p / 2);
            },
          });
          edges.push(edge);
        });
        update();
      });
    },
  };
}
