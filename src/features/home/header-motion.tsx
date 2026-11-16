"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Keep the extracted roof symbol while the lettering retracts on page scroll. */
export function HomeHeaderMotion({
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
      const header = root.current;
      const board = header?.closest<HTMLElement>('[data-home-design="web-02"]');
      const host = board?.parentElement;
      const link =
        header?.querySelector<HTMLAnchorElement>("[data-header-logo]");
      const svg = link?.querySelector("svg");
      if (!header || !board || !host || !link || !svg) return;
      const symbol = [
        ...svg.querySelectorAll<SVGGElement>('[data-brand-part="symbol"]'),
      ];
      const copy = [
        ...svg.querySelectorAll<SVGGElement>('[data-brand-part="copy"]'),
      ];
      if (symbol.length !== 3 || copy.length !== 4) return;

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const boxes = symbol.map((part) => part.getBBox());
        const left = Math.min(...boxes.map((box) => box.x));
        const right = Math.max(...boxes.map((box) => box.x + box.width));
        const viewBox = svg.viewBox.baseVal;
        const shift = viewBox.x + viewBox.width / 2 - (left + right) / 2;
        const timeline = gsap.timeline({ paused: true });
        timeline.to(
          copy,
          {
            opacity: 0,
            x: -viewBox.width * 0.08,
            duration: 0.18,
            ease: "power1.inOut",
          },
          0,
        );
        timeline.to(
          symbol,
          { x: shift, duration: 0.45, ease: "power2.inOut" },
          0.08,
        );

        // Natural document coordinates stay stable through the opening's translation.
        const start = () =>
          host.getBoundingClientRect().top + window.scrollY + board.offsetTop;
        const distance = () => Math.max(48, header.offsetHeight * 0.4);
        let compact = false;
        const sync = (self: ScrollTrigger) => {
          const offset = self.scroll() - start();
          if (offset <= 0) {
            // A fast return must hand a fully expanded SVG back to the opening morph.
            compact = false;
            timeline.pause(0);
          } else {
            const next =
              offset >= distance()
                ? true
                : offset <= distance() * 0.4
                  ? false
                  : compact;
            if (next !== compact) {
              compact = next;
              if (compact) timeline.play();
              else timeline.reverse();
            }
          }
          link.dataset.brandState = compact ? "compact" : "expanded";
        };
        const trigger = ScrollTrigger.create({
          start,
          end: () => start() + distance(),
          onUpdate: sync,
          onRefresh: sync,
        });
        // Restore a scrolled page directly in its correct state without an arrival flash.
        sync(trigger);
        timeline.progress(compact ? 1 : 0).pause();
        link.dataset.brandMotion = "active";

        return () => {
          delete link.dataset.brandMotion;
          delete link.dataset.brandState;
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <header ref={root} id={id} tabIndex={-1} className={className}>
      {children}
    </header>
  );
}
