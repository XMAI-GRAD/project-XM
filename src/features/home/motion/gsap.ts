"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

/** Home motion plays only here; under reduced motion everything stays in place. */
export const MOTION = "(prefers-reduced-motion: no-preference)";
/** Hover effects, for pointers that can hover. */
export const HOVER =
  "(prefers-reduced-motion: no-preference) and (hover: hover)";

/** Keep dev's entrance thresholds in the visible scene, after the opening/hold. */
export function homeEnter(
  target: Element | null,
  viewport = 0.7,
  hero = false,
) {
  return () => {
    if (!target) return 0;
    const board = target.closest<HTMLElement>('[data-home-design="web-02"]');
    const main = board?.querySelector("main");
    const opening = board?.parentElement?.querySelector("[data-opening]");
    let top = target.getBoundingClientRect().top + window.scrollY;
    if (board && main && opening) {
      // The opening translates the board; the logo hold translates main. Their
      // current values must not move the trigger each time ScrollTrigger refreshes.
      top -= Number(gsap.getProperty(board, "y")) || 0;
      top -= Number(gsap.getProperty(main, "y")) || 0;
      if (!hero)
        top +=
          parseFloat(
            getComputedStyle(board).getPropertyValue("--brand-hold"),
          ) || 0;
      const openingEnd =
        opening.getBoundingClientRect().bottom + window.scrollY;
      // Native anchor entry can land exactly on the boundary. Start one pixel
      // before it so the hero also plays after click/keyboard entry without a wheel.
      return Math.max(openingEnd - 1, top - window.innerHeight * viewport);
    }
    return top - window.innerHeight * viewport;
  };
}

/**
 * What a word's tween must clear when it ends. A split word is an inline-block in a
 * heading trimmed to its capitals (text-box); left with an inline transform, Chrome
 * can lay its line out taller, so the lines below shift once the motion is over.
 */
export const CLEAR_WORD = "transform,translate,rotate,scale,opacity";

export { gsap, ScrollTrigger, useGSAP };
