"use client";

import { useRef, type ReactNode } from "react";
import { homeEnter, gsap, HOVER, MOTION, useGSAP } from "./gsap";

/** How long each part of a layer takes; all three play together. */
const DURATION = 1.5;
/** How far the caption drifts the way it spreads, in comp units. */
const DRIFT = 40;
const SOFT = "power2.out";
/** The magnet, in comp units: how close the halves pull in, how far they push out. */
const PULL = 14;
const PUSH = 10;

/** A pair of shapes split into its upper and lower half, by where each piece sits. */
function halves(svg: SVGSVGElement) {
  const first = svg.firstElementChild!;
  const pieces = [
    ...(first.tagName === "g" && first.children.length > 1
      ? first.children
      : svg.children),
  ] as SVGGraphicsElement[];
  const middle = svg.viewBox.baseVal.y + svg.viewBox.baseVal.height / 2;
  const centre = (el: SVGGraphicsElement) => {
    const b = el.getBBox();
    return b.y + b.height / 2;
  };
  return {
    upper: pieces.filter((el) => centre(el) < middle),
    lower: pieces.filter((el) => centre(el) >= middle),
  };
}

/**
 * Layers: ĐỊA · VỊ · NGHỀ. As each layer scrolls into view, once, its name rises out
 * of its baseline while, at the same time, its line draws away from the name and its
 * caption spreads the same way — ĐỊA and NGHỀ to the left, VỊ to the right. The way
 * is read from the layout: the line draws from its end nearest the name.
 * The layer's pair of shapes fades in; hovering it, its two halves pull together and
 * push apart once, like magnets, and settle back.
 */
export function LayersMotion({
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
        const unit = root.current!.getBoundingClientRect().width / 1920;

        q<HTMLElement>("li[data-layer]").forEach((item) => {
          const layer = item.dataset.layer!;
          const name = item.querySelector<HTMLElement>(
            '[data-motion="layer-name"]',
          )!;
          const caption = item.querySelector<HTMLElement>(
            '[data-motion="layer-caption"]',
          )!;
          const svg = item.querySelector<SVGSVGElement>(
            `[data-art="layer-${layer}-line"]`,
          )!;
          const line = svg.querySelector<SVGGeometryElement>("path, line")!;

          // Which end of the line is the name's: compare both ends with the name's
          // centre, in the drawing's units.
          const box = name.getBoundingClientRect();
          const centre = new DOMPoint(
            box.left + box.width / 2,
            0,
          ).matrixTransform(svg.getScreenCTM()!.inverse()).x;
          const length = line.getTotalLength();
          const startX = line.getPointAtLength(0).x;
          const endX = line.getPointAtLength(length).x;
          const fromStart =
            Math.abs(startX - centre) <= Math.abs(endX - centre);
          const toLeft = (fromStart ? endX - startX : startX - endX) < 0;

          gsap
            .timeline({
              scrollTrigger: {
                trigger: svg,
                start: homeEnter(svg, 0.8),
                once: true,
              },
              defaults: { duration: DURATION, ease: SOFT },
            })
            // The name rises out of its baseline, accents included.
            .fromTo(
              name,
              { yPercent: 70, clipPath: "inset(100% -10% -40% -10%)" },
              {
                yPercent: 0,
                clipPath: "inset(-70% -10% -40% -10%)",
                clearProps: "transform,clipPath",
              },
              0,
            )
            .fromTo(
              line,
              { drawSVG: fromStart ? "0% 0%" : "100% 100%" },
              { drawSVG: "0% 100%", ease: "power2.inOut" },
              0,
            )
            // The caption opens from the name's side and drifts the same way.
            .fromTo(
              caption,
              {
                x: (toLeft ? DRIFT : -DRIFT) * unit,
                clipPath: toLeft
                  ? "inset(-50% 0% -50% 100%)"
                  : "inset(-50% 100% -50% 0%)",
              },
              {
                x: 0,
                clipPath: "inset(-50% 0% -50% 0%)",
                clearProps: "transform,clipPath",
              },
              0.15,
            );
        });

        q<SVGSVGElement>('[data-art$="-shapes"]').forEach((shapes) =>
          gsap.from(shapes, {
            opacity: 0,
            duration: 1.4,
            ease: "power1.out",
            clearProps: "opacity",
            scrollTrigger: {
              trigger: shapes,
              start: homeEnter(shapes, 0.85),
              once: true,
            },
          }),
        );
      });

      gsap.matchMedia().add(HOVER, () => {
        const q = gsap.utils.selector(root);
        const cleanups = q<SVGSVGElement>('[data-art$="-shapes"]').map(
          (shapes) => {
            const { upper, lower } = halves(shapes);
            const both = [...upper, ...lower];
            let magnet: gsap.core.Timeline | null = null;

            // Once per hover: rest → pulled together (quickening) → pushed apart (a
            // snap) → back to rest. A hover during a run lets that run finish.
            const enter = () => {
              if (magnet?.isActive()) return;
              magnet = gsap
                .timeline()
                .to(upper, { y: PULL, duration: 0.45, ease: "power2.in" }, 0)
                .to(lower, { y: -PULL, duration: 0.45, ease: "power2.in" }, 0)
                .to(upper, { y: -PUSH, duration: 0.5, ease: "power3.out" })
                .to(lower, { y: PUSH, duration: 0.5, ease: "power3.out" }, "<")
                .to(both, { y: 0, duration: 0.6, ease: "sine.inOut" });
            };

            shapes.addEventListener("pointerenter", enter);
            return () => shapes.removeEventListener("pointerenter", enter);
          },
        );
        return () => cleanups.forEach((cleanup) => cleanup());
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
