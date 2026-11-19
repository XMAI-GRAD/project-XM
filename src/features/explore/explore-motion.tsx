"use client";

import { useRouter } from "next/navigation";
import { useRef, type ReactNode } from "react";
import type { Layer } from "@/content";
import {
  gsap,
  MOTION,
  ScrollTrigger,
  useGSAP,
} from "@/features/home/motion/gsap";
import {
  attachGateTransition,
  LABEL_CLIPPED,
  LABEL_SHOWN,
} from "./gate-transition";

/** Matches home Layers (src/features/home/motion/layers-motion.tsx). */
const DURATION = 1.5;
const DRIFT = 40;
const SOFT = "power2.out";
/** How far a gate rises as it pops in, in comp units. */
const RISE = 18;
const GATE_CLIPPED = "inset(100% -10% -10% -10%)";
const GATE_SHOWN = "inset(-10% -10% -10% -10%)";

/**
 * Explore slide motion, paced like home's Layers (DURATION 1.5 s, power2.out):
 * on arrival the layer name rises out of its baseline, its line draws away from
 * the name and its caption opens from the name's side. All five gates move as
 * one group on a single ScrollTrigger, reversing only after all five have left
 * the viewport and replaying together on re-entry. Selecting a gate runs the
 * shared exit + FLIP hand-off into the point page.
 */
export function ExploreMotion({
  className,
  layer,
  labelledBy,
  children,
}: {
  className: string;
  layer: Layer;
  labelledBy: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();

  useGSAP(
    () => {
      const section = root.current!;

      gsap.matchMedia().add(MOTION, () => {
        const q = gsap.utils.selector(section);
        const unit = section.getBoundingClientRect().width / 1920;

        const name = q<HTMLElement>("[data-explore-name]")[0] ?? null;
        const caption = q<HTMLElement>("[data-explore-caption]")[0] ?? null;
        const lineSvg = q<SVGSVGElement>('svg[data-art$="-line"]')[0] ?? null;
        const line =
          lineSvg?.querySelector<SVGGeometryElement>("path, line") ?? null;

        // Read direction from layout (same as home's layers-motion.tsx).
        let fromStart = true;
        let toLeft = false;
        if (name && lineSvg && line) {
          const box = name.getBoundingClientRect();
          const ctm = lineSvg.getScreenCTM();
          if (ctm) {
            const centre = new DOMPoint(
              box.left + box.width / 2,
              0,
            ).matrixTransform(ctm.inverse()).x;
            const length = line.getTotalLength();
            const startX = line.getPointAtLength(0).x;
            const endX = line.getPointAtLength(length).x;
            fromStart = Math.abs(startX - centre) <= Math.abs(endX - centre);
            toLeft = (fromStart ? endX - startX : startX - endX) < 0;
          }
        }

        const gates = q<HTMLElement>("[data-explore-gate]").map((gate) => ({
          gate,
          svg: gate.querySelector<SVGSVGElement>("[data-gate-svg]"),
          photo: gate.querySelector<SVGImageElement>("[data-gate-photo]"),
          label: gate.querySelector<HTMLElement>("[data-gate-name]"),
        }));

        // Clear any leftover exit styles before measuring or animating.
        const detachTransition = attachGateTransition({
          scope: section,
          router,
          onExitStart: () => {
            headingTl.kill();
            gatesTl?.scrollTrigger?.kill();
            gatesTl?.kill();
          },
          addExit: (tl, u) => {
            if (name) {
              tl.fromTo(
                name,
                { yPercent: 0, clipPath: "inset(-70% -10% -40% -10%)" },
                {
                  yPercent: 70,
                  clipPath: "inset(140% -10% -40% -10%)",
                  duration: 0.42,
                  ease: "power2.in",
                },
                0,
              );
            }
            if (line) {
              tl.to(
                line,
                {
                  drawSVG: fromStart ? "0% 0%" : "100% 100%",
                  duration: 0.44,
                  ease: "power2.in",
                },
                0,
              );
            }
            if (caption) {
              tl.fromTo(
                caption,
                { x: 0, clipPath: "inset(-70% 0% -40% 0%)" },
                {
                  x: (toLeft ? DRIFT : -DRIFT) * u,
                  clipPath: toLeft
                    ? "inset(-70% 0% -40% 100%)"
                    : "inset(-70% 100% -40% 0%)",
                  duration: 0.4,
                  ease: "power2.in",
                },
                0,
              );
            }
          },
          extraResetTargets: () =>
            [name, caption].filter((el): el is HTMLElement => el !== null),
          onReset: () => {
            if (line) {
              gsap.killTweensOf(line);
              gsap.set(line, { drawSVG: "0% 100%" });
            }
          },
        });

        // 1. Heading, line and caption — same pace and feel as home Layers.
        const headingTl = gsap.timeline({
          defaults: { duration: DURATION, ease: SOFT },
        });

        if (name) {
          headingTl.fromTo(
            name,
            { yPercent: 70, clipPath: "inset(100% -10% -40% -10%)" },
            {
              yPercent: 0,
              clipPath: "inset(-70% -10% -40% -10%)",
              clearProps: "transform,clipPath",
            },
            0,
          );
        }

        if (line) {
          headingTl.fromTo(
            line,
            { drawSVG: fromStart ? "0% 0%" : "100% 100%" },
            { drawSVG: "0% 100%", ease: "power2.inOut" },
            0,
          );
        }

        if (caption) {
          headingTl.fromTo(
            caption,
            {
              x: (toLeft ? DRIFT : -DRIFT) * unit,
              clipPath: toLeft
                ? "inset(-70% 0% -40% 100%)"
                : "inset(-70% 100% -40% 0%)",
            },
            {
              x: 0,
              clipPath: "inset(-70% 0% -40% 0%)",
              clearProps: "transform,clipPath",
            },
            0.15,
          );
        }

        // 2. All five gates as ONE group on a single ScrollTrigger.
        // The list's <li> children are absolutely placed, so the <ul> itself has
        // zero height; measure the union of the five gates instead.
        let gatesTl: gsap.core.Timeline | null = null;
        if (gates.length) {
          const groupBounds = () => {
            const rects = gates.map((p) => p.gate.getBoundingClientRect());
            return {
              top: Math.min(...rects.map((r) => r.top)) + window.scrollY,
              bottom: Math.max(...rects.map((r) => r.bottom)) + window.scrollY,
            };
          };

          gatesTl = gsap.timeline({
            scrollTrigger: {
              start: () => groupBounds().top - window.innerHeight,
              end: () => Math.floor(groupBounds().bottom),
              toggleActions: "play reverse play reverse",
            },
          });

          gates.forEach(({ svg, photo, label }, index) => {
            const at = 0.25 + index * 0.11;
            if (svg) {
              gatesTl!.fromTo(
                svg,
                {
                  clipPath: GATE_CLIPPED,
                  scale: 0.9,
                  y: RISE * unit,
                  transformOrigin: "50% 55%",
                },
                {
                  clipPath: GATE_SHOWN,
                  scale: 1,
                  y: 0,
                  duration: 0.9,
                  ease: "back.out(1.25)",
                },
                at,
              );
            }
            if (photo) {
              gatesTl!.fromTo(
                photo,
                { scale: 1.08, transformOrigin: "50% 50%" },
                { scale: 1, duration: 1.1, ease: SOFT },
                at,
              );
            }
            if (label) {
              gatesTl!.fromTo(
                label,
                { clipPath: LABEL_CLIPPED, yPercent: -100 },
                {
                  clipPath: LABEL_SHOWN,
                  yPercent: 0,
                  duration: 0.65,
                  ease: SOFT,
                },
                at + 0.22,
              );
            }
          });

          ScrollTrigger.refresh();
        }

        return () => {
          detachTransition();
        };
      });

      // Lifts the CSS that holds content back until this first paint (explore.module.css).
      section.dataset.arrived = "";
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className={className}
      data-layer={layer}
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}
