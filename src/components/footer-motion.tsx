"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";

/** How far each row rises into place, in comp units. */
const RISE = 120;
/** When each row starts, as a share of the scroll, row by row. */
const ROW_GAP = 0.3;
/** Within a row, the delay between its columns. */
const COLUMN_GAP = 0.06;
/** Seconds the rows take to catch up with the scroll, so they glide. */
const SMOOTH = 1;

/**
 * The footer's arrival, tied to the scroll: as it comes up, a navy band shows first,
 * then its rows ([data-footer-row] 1, 2, 3) rise from below and fade in, one after
 * another, settling as the page reaches its end. Scrolling back up plays it in reverse.
 * Only opacity moves, never visibility, so the links stay reachable by keyboard
 * (focusing one scrolls the footer in, which reveals it).
 */
export function FooterMotion({
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
        const footer = root.current!;
        const unit = () => footer.getBoundingClientRect().width / 1920;
        const rows = ["1", "2", "3"].map((row) =>
          gsap.utils.toArray<HTMLElement>(`[data-footer-row="${row}"]`, footer),
        );

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 1 },
          scrollTrigger: {
            trigger: footer,
            start: "top 75%",
            // The footer ends the page, so its reveal ends with the scroll.
            end: "max",
            scrub: SMOOTH,
            invalidateOnRefresh: true,
          },
        });
        rows.forEach((items, i) =>
          tl.fromTo(
            items,
            { y: () => RISE * unit(), opacity: 0 },
            { y: 0, opacity: 1, stagger: COLUMN_GAP },
            i * ROW_GAP,
          ),
        );
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className={className}>
      {children}
    </footer>
  );
}
