"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";
import { motionAllowed } from "../explore-motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CLIPPED = "inset(0 0 100% 0)";
const SHOWN = "inset(0 0 0% 0)";
const START = "top 88%";

/**
 * The page's motion. On arrival the photo settles while the name and its line
 * slide in, then the info bar unrolls. Below the fold, blocks reveal once as
 * they scroll into view: short lines slide out from their top edge
 * (`data-unroll`), longer blocks are wiped open (`data-wipe`).
 */
export function PointMotion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const arrived = useRef(false);

  useGSAP(
    () => {
      if (!arrived.current && motionAllowed()) {
        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              arrived.current = true;
            },
          })
          .fromTo(
            "[data-media]",
            { scale: 1.08 },
            { scale: 1, duration: 1.2, clearProps: "transform" },
            0,
          )
          .fromTo(
            "[data-reveal]",
            { clipPath: CLIPPED, yPercent: -100 },
            {
              clipPath: SHOWN,
              yPercent: 0,
              duration: 0.7,
              stagger: 0.12,
              clearProps: "clipPath,transform",
            },
            0.1,
          )
          .fromTo(
            "[data-cell]",
            { clipPath: CLIPPED },
            {
              clipPath: SHOWN,
              duration: 0.6,
              stagger: 0.08,
              clearProps: "clipPath",
            },
            0.45,
          )
          .fromTo(
            "[data-cell] > *",
            { y: -20 },
            { y: 0, duration: 0.6, stagger: 0.04, clearProps: "transform" },
            0.45,
          );

        gsap.utils.toArray<HTMLElement>("[data-unroll]").forEach((el) => {
          // The parent, because the slide would move this element's own start point.
          const parent = el.parentElement!;
          gsap.fromTo(
            el,
            { clipPath: CLIPPED, yPercent: -100 },
            {
              clipPath: SHOWN,
              yPercent: 0,
              duration: 0.6,
              ease: "power3.out",
              delay: [...parent.children].indexOf(el) * 0.08,
              clearProps: "clipPath,transform",
              scrollTrigger: { trigger: parent, start: START, once: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-wipe]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: CLIPPED },
            {
              clipPath: SHOWN,
              duration: 0.8,
              ease: "power3.out",
              clearProps: "clipPath",
              scrollTrigger: { trigger: el, start: START, once: true },
            },
          );
        });
      }
      // Lifts the CSS that holds content back until this first paint (page.module.css).
      root.current!.dataset.arrived = "";
    },
    { scope: root },
  );

  return (
    <article ref={root} className={className}>
      {children}
    </article>
  );
}
