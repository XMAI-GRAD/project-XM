"use client";

import { useRef, type ReactNode } from "react";
import { CLEAR_WORD, ENTER, gsap, MOTION, useGSAP } from "./gsap";

/** How fast the line runs, in comp units a second. Calm, and even: each name rises
 *  as the line reaches it, so its pace sets when the names show. */
const SPEED = 360;
/** When the line sets off, and the buildings with it, after the motto starts to show. */
const LINE_START = 0.5;
/** How far a building rises from, in comp units: below the ground line, out of view. */
const RISE = 460;
/** Between two buildings starting to rise, left to right. */
const BUILD_GAP = 0.3;
const SOFT = "power2.out";
/** The whole scene's tempo, as a speed-up: it plays in 1 / PACE of the time the
 *  numbers above say (1.25, then 15% quicker again: 0.8 × 0.85 = 0.68 of the time). */
const PACE = 1 / (0.8 * 0.85);

/** The buildings, left to right, with the role label that belongs to each. */
const buildings = [
  { role: "public", parts: ["public"] },
  { role: "artists", parts: ["artists"] },
  { role: "state", parts: ["state-roof", "state-house"] },
];

interface Segment {
  el: SVGGeometryElement;
  length: number;
  reversed: boolean; // drawn right to left in the export
}

/**
 * Roles: the violet line runs from the left edge while the actors — the public, the
 * artists, the state — rise from the ground; each name rises as the line reaches it,
 * and the motto writes itself in at the line's pace, its accented words stressed. The
 * clouds drift in from the right. Once.
 */
export function RolesMotion({
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
        const q = gsap.utils.selector(root);
        const part = (name: string) =>
          q<SVGGElement>(`[data-art="roles-cluster"] [data-part="${name}"]`)[0];

        // The line is three pieces in the export, each drawn right to left; run them
        // left to right, one after another, as a single line.
        const segments: Segment[] = q<SVGGeometryElement>(
          '[data-art="roles-line"] line, [data-art="roles-cluster"] [data-part="line"] path',
        )
          .map((el) => {
            const length = el.getTotalLength();
            const a = el.getPointAtLength(0);
            const b = el.getPointAtLength(length);
            return {
              el,
              length,
              reversed: a.x > b.x,
              left: Math.min(a.x, b.x),
            };
          })
          .sort((a, b) => a.left - b.left);
        const total = segments.reduce((sum, s) => sum + s.length, 0);

        /** Where the line is after it has run `d` units. */
        const pointAt = (d: number) => {
          for (const s of segments) {
            if (d <= s.length)
              return s.el.getPointAtLength(s.reversed ? s.length - d : d);
            d -= s.length;
          }
          const last = segments[segments.length - 1];
          return last.el.getPointAtLength(last.reversed ? 0 : last.length);
        };
        /** How far the line has run when it first reaches `x`. */
        const reach = (x: number) => {
          for (let d = 0; d <= total; d += 4) if (pointAt(d).x >= x) return d;
          return total;
        };
        const timeAt = (d: number) => LINE_START + d / SPEED;

        const tl = gsap
          .timeline({
            scrollTrigger: { trigger: root.current, start: ENTER, once: true },
            defaults: { ease: SOFT },
          })
          .timeScale(PACE);

        // The motto writes itself left to right at the line's pace: its words are
        // spread over the line's run. Words in an accent tone ("sáng tạo", "nối
        // tiếp") land larger and settle, then beat once together as the line arrives.
        const words = q<HTMLElement>("h2 [data-word]");
        const stressed = words.filter((w) => w.dataset.tone);
        const span = timeAt(total) - LINE_START - 0.6;
        let landed = 0; // when the last stressed word has settled
        words.forEach((word, i) => {
          const at = LINE_START + (span * i) / Math.max(1, words.length - 1);
          if (word.dataset.tone) landed = at + 1.2;
          tl.from(
            word,
            word.dataset.tone
              ? {
                  scale: 1.6,
                  opacity: 0,
                  transformOrigin: "50% 70%",
                  duration: 1.2,
                  ease: "back.out(1.7)",
                  clearProps: CLEAR_WORD,
                }
              : { y: 14, opacity: 0, duration: 0.9, clearProps: CLEAR_WORD },
            at,
          );
        });
        // The beat starts once the stressed words have settled, and from their true
        // size: begun mid-settle, it would hand them back at a size off by a hair.
        tl.fromTo(
          stressed,
          { scale: 1 },
          {
            immediateRender: false,
            scale: 1.14,
            transformOrigin: "50% 70%",
            duration: 0.35,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
            clearProps: CLEAR_WORD,
          },
          Math.max(timeAt(total) + 0.2, landed),
        );

        let at = LINE_START;
        for (const s of segments) {
          const duration = s.length / SPEED;
          tl.fromTo(
            s.el,
            { drawSVG: s.reversed ? "100% 100%" : "0% 0%" },
            { drawSVG: "0% 100%", duration, ease: "none" },
            at,
          );
          at += duration;
        }

        // A name's left edge, in the drawing's units, to know when the line gets there.
        const cluster = q<SVGSVGElement>('[data-art="roles-cluster"]')[0];
        const toDrawing = cluster.getScreenCTM()!.inverse();
        const leftOf = (el: Element) =>
          new DOMPoint(el.getBoundingClientRect().left, 0).matrixTransform(
            toDrawing,
          ).x;

        buildings.forEach(({ role, parts }, i) => {
          const rise = LINE_START + i * BUILD_GAP;
          tl.from(
            parts.map(part),
            { y: RISE, duration: 2.4, stagger: 0.2 },
            rise,
          );
          if (role === "artists")
            tl.from(
              part("artists-crown"),
              {
                scale: 0,
                transformOrigin: "50% 100%",
                duration: 1.2,
                ease: "back.out(1.4)",
              },
              rise + 1.8,
            );
          const name = q(`[data-role="${role}"]`)[0];
          tl.from(
            name,
            { y: 24, opacity: 0, duration: 1.2 },
            timeAt(reach(leftOf(name))),
          );
        });

        tl.from(
          part("star"),
          {
            scale: 0,
            rotation: -90,
            transformOrigin: "50% 50%",
            duration: 2,
            ease: "back.out(1.1)",
          },
          timeAt(total),
        ).from(
          q(
            '[data-art="roles-wave"], [data-art="roles-petal"], [data-art="roles-cloud"]',
          ),
          { x: 500, opacity: 0, duration: 2.8, stagger: 0.35 },
          LINE_START + 0.8,
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
