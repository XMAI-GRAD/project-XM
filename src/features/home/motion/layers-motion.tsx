"use client";

import { useRef, type ReactNode } from "react";
import { gsap, HOVER, MOTION, ScrollTrigger, useGSAP } from "./gsap";

/** How long each part of a layer takes; all three play together. */
const DURATION = 1.5;
/** How far the caption drifts the way it spreads, in comp units. */
const DRIFT = 40;
const SOFT = "power2.out";
/** Where, through a layer's pass across the window, it plays itself out again. */
const OUT_AT = 0.8;

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
 * Layers: ĐỊA · VỊ · NGHỀ, played as one group. As it comes into view, each name
 * rises out of its baseline while its line draws away from the name and its caption
 * spreads the same way — ĐỊA and NGHỀ to the left, VỊ to the right. The way
 * is read from the layout: the line draws from its end nearest the name.
 * Each pair of shapes opens out from the seam between its halves. Once the group
 * is 80% of the way across the window, all of it plays back out the way it
 * came (the halves close to the seam, the caption and line run back to the name),
 * and in again on the way back up. Hovering the shapes, the two halves pull
 * together and push apart once, like magnets, and settle back.
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

        const master = gsap.timeline({ paused: true });
        const groupBoxes: SVGSVGElement[] = [];
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

          const tl = gsap
            .timeline({
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

          // The pair of shapes isn't there to begin with: it opens out from the seam
          // between its halves, the upper one growing up and the lower one down.
          const shapes = item.querySelector<SVGSVGElement>(
            '[data-art$="-shapes"]',
          )!;
          const { upper, lower } = halves(shapes);
          const frame = shapes.viewBox.baseVal;
          const seam = `${frame.x + frame.width / 2} ${frame.y + frame.height / 2}`;
          tl.fromTo(
            [...upper, ...lower],
            { scaleY: 0, svgOrigin: seam },
            { scaleY: 1, svgOrigin: seam, ease: "power3.out" },
            0.1,
          );

          master.add(tl, 0);
          groupBoxes.push(shapes);
        });

        // The three layers play as one. In once the whole group is in view (its
        // last shapes reach the bottom of the window, or on a short window its top
        // is well up it); out again, the way it came, once the group is 80% of the
        // way across the window, and back in on the way up.
        const groupBox = () => {
          const rects = groupBoxes.map((el) => el.getBoundingClientRect());
          const top = Math.min(...rects.map((r) => r.top));
          const bottom = Math.max(...rects.map((r) => r.bottom));
          return { top, height: bottom - top, bottom };
        };
        let arrived = false;
        let shown = false;
        const show = (on: boolean) => {
          if (on === shown) return;
          shown = on;
          if (on) master.timeScale(1).play();
          else master.timeScale(1.3).reverse();
        };
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: () => {
            const vh = window.innerHeight;
            const box = groupBox();
            if (!arrived) arrived = box.bottom <= vh || box.top <= vh * 0.3;
            if (!arrived) return;
            show((vh - box.top) / (vh + box.height) < OUT_AT);
          },
        });
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
