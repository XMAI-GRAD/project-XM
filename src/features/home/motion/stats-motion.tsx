"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "./edge";
import { gsap, MOTION, useGSAP } from "./gsap";

/** Between two counts settling, left to right, in bands (the footer's columns). */
const COLUMN_LAG = 0.1;

/**
 * The band of four counts: each count, its icon, number and label together, rises
 * into place as the band comes up from the window's foot, one after another from
 * the left, and sinks back down and fades out there on the way up, like the footer.
 * The numbers count up on their own (count-up.tsx).
 */
export function StatsMotion({
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
        // A count is measured by its icon, its top.
        edge.add(
          q<HTMLElement>("li").map((el) => ({
            el,
            ref: el.querySelector('[data-motion="stat-icon"]')!,
          })),
          { lag: COLUMN_LAG, shown: false },
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
