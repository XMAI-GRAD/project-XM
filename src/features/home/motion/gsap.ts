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

/** A section's motion plays once, when its top passes this line of the window. */
export const ENTER = "top 70%";

/**
 * What a word's tween must clear when it ends. A split word is an inline-block in a
 * heading trimmed to its capitals (text-box); left with an inline transform, Chrome
 * can lay its line out taller, so the lines below shift once the motion is over.
 */
export const CLEAR_WORD = "transform,translate,rotate,scale,opacity";

export { gsap, ScrollTrigger, useGSAP };
