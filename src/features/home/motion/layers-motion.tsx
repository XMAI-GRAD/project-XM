"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "./edge";
import { gsap, HOVER, MOTION, ScrollTrigger, useGSAP } from "./gsap";

/** How long each part of a layer takes; all three play together. */
const DURATION = 1.5;
/** How far the caption drifts the way it spreads, in comp units. */
const DRIFT = 40;
const SOFT = "power2.out";
/** Where, through the group's pass across the window, it plays itself out again. */
const OUT_AT = 0.8;
/** On the way back up, where it plays itself out below: its top this far down the
 *  window, most of it out of sight under the foot. */
const BELOW_AT = 0.6;

/** A hovered label (name, line and caption) grows by this much, from its bottom
 *  corner on the name's side, so it opens out away from the shapes. */
const ZOOM = 1.25;
/** NGHỀ, the last layer, grows from its top corner instead: down, not up. */
const FROM_TOP = new Set(["craft"]);
/** The frame's inner edges, and what a grown label keeps clear of them, in comp
 *  units (the frame is painted over the page, so it would cut the label off). */
const FRAME_LEFT = 180;
const FRAME_RIGHT = 1740;
const EDGE_ROOM = 24;

/** A pair of shapes once the layers are in, and when not hovered: how much it shows
 *  (as the roles' buildings). Hovering it, or its label, shows it whole. */
const DIMMED = 0.5;

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
 * and in again on the way back up; scrolling on up, once it sinks under the foot
 * of the window, it plays out again, and in once more on the way down.
 * Once in, the pairs of shapes dim to half, like the roles' buildings; hovering a
 * pair, or its label, shows it whole again and zooms the label: the two go together.
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
      gsap.matchMedia().add(MOTION, (context) => {
        const q = gsap.utils.selector(root);
        const unit = root.current!.getBoundingClientRect().width / 1920;

        // The kicker, the title and the way into the map have no entrance of their
        // own: they rise from the window's foot and sink back there, like the footer.
        edgeMotion(
          context,
          () => root.current!.getBoundingClientRect().width / 1920,
        ).add(
          [...q<HTMLElement>("h2 > span"), ...q<HTMLElement>(":scope > a")],
          {
            shown: false,
          },
        );

        const master = gsap.timeline({ paused: true });
        const groupBoxes: SVGSVGElement[] = [];
        /** Each layer's label, the parts that grow together on hover. */
        const labels: {
          parts: Element[];
          toLeft: boolean;
          fromTop: boolean;
          shapes: SVGSVGElement;
        }[] = [];
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
          labels.push({
            parts: [name, svg, caption],
            toLeft,
            fromTop: FROM_TOP.has(layer),
            shapes,
          });
        });

        // The three layers play as one. In once the whole group is in view (its
        // last shapes reach the bottom of the window, or on a short window its top
        // is well up it); out again, the way it came, once it leaves the window
        // either way: 80% of the way across it going down, or sunk under its foot
        // going back up. Back in when it comes back the same way it first came in.
        const groupBox = () => {
          const rects = groupBoxes.map((el) => el.getBoundingClientRect());
          const top = Math.min(...rects.map((r) => r.top));
          const bottom = Math.max(...rects.map((r) => r.bottom));
          return { top, height: bottom - top, bottom };
        };
        const dim = (shapes: Element, opacity: number, duration: number) =>
          gsap.to(shapes, {
            opacity,
            duration,
            ease: "power1.out",
            overwrite: "auto",
          });
        // Played in, the pairs dim (the lit one, under the pointer, stays whole).
        master.eventCallback("onComplete", () =>
          labels.forEach((label) => {
            if (label !== lit) dim(label.shapes, DIMMED, 0.8);
          }),
        );
        let shown = false;
        const show = (on: boolean) => {
          if (on === shown) return;
          shown = on;
          if (on) master.timeScale(1).play();
          else {
            zoom(null, true);
            light(null);
            master.timeScale(1.3).reverse();
          }
        };

        // Hovering a layer's label (its name, line and caption, once all in) zooms
        // it, the three as one, grown from its bottom corner on the name's side
        // (NGHỀ's top corner).
        // Measured where each part is laid out, so a grown label doesn't move what
        // the pointer is tested against.
        const host = root.current!;
        const laidOut = (el: Element) => {
          const cs = getComputedStyle(el);
          const left = parseFloat(cs.left);
          const top = parseFloat(cs.top);
          return {
            left,
            top,
            right: left + parseFloat(cs.width),
            bottom: top + parseFloat(cs.height),
          };
        };
        const boxOf = (parts: Element[]) => {
          const boxes = parts.map(laidOut);
          return {
            left: Math.min(...boxes.map((b) => b.left)),
            top: Math.min(...boxes.map((b) => b.top)),
            right: Math.max(...boxes.map((b) => b.right)),
            bottom: Math.max(...boxes.map((b) => b.bottom)),
          };
        };
        const hover = window.matchMedia(HOVER);
        let zoomed: (typeof labels)[number] | null = null;
        // Each label's own zoom tween: a new hover replaces it, so a label hovered
        // again while it shrinks keeps its corner (the shrink's clean-up would
        // otherwise reset it under the new zoom). The labels' other tweens, in the
        // layers' timeline, are never touched.
        const tweens = new Map<(typeof labels)[number], gsap.core.Tween>();
        const zoomTo = (
          label: (typeof labels)[number],
          vars: gsap.TweenVars,
        ) => {
          tweens.get(label)?.kill();
          tweens.set(label, gsap.to(label.parts, vars));
        };
        const zoom = (next: (typeof labels)[number] | null, now = false) => {
          if (next === zoomed) return;
          const last = zoomed;
          if (last)
            zoomTo(last, {
              scale: 1,
              duration: now ? 0 : 0.4,
              ease: "power2.out",
              onComplete: () => {
                gsap.set(last.parts, {
                  clearProps: "transform,transformOrigin,zIndex",
                });
              },
            });
          zoomed = next;
          if (!next) return;
          const box = boxOf(next.parts);
          const x = next.toLeft ? box.right : box.left;
          // A label growing towards the frame stops short of its edge.
          const unit = host.getBoundingClientRect().width / 1920;
          const edge = (next.toLeft ? FRAME_LEFT : FRAME_RIGHT) * unit;
          const room = (next.toLeft ? x - edge : edge - x) - EDGE_ROOM * unit;
          const scale = Math.max(
            1,
            Math.min(ZOOM, room / (box.right - box.left)),
          );
          tweens.get(next)?.kill();
          next.parts.forEach((part) => {
            const at = laidOut(part);
            gsap.set(part, {
              zIndex: 2,
              transformOrigin: `${x - at.left}px ${(next.fromTop ? box.top : box.bottom) - at.top}px`,
            });
          });
          zoomTo(next, { scale, duration: 0.45, ease: "power3.out" });
        };
        // The pair lit by the pointer, over its shapes or its label; the others dim.
        let lit: (typeof labels)[number] | null = null;
        const light = (next: (typeof labels)[number] | null) => {
          if (next === lit) return;
          if (lit) dim(lit.shapes, DIMMED, 0.5);
          lit = next;
          if (next) dim(next.shapes, 1, 0.35);
        };
        const pick = (e: PointerEvent) => {
          if (!hover.matches || !shown || master.isActive()) return away();
          const page = host.getBoundingClientRect();
          const x = e.clientX - page.left;
          const y = e.clientY - page.top;
          const inside = (b: ReturnType<typeof boxOf>) =>
            x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
          // A layer's label and its shapes go together: either one under the
          // pointer zooms the label and lights the shapes.
          const under =
            labels.find(
              ({ parts, shapes }) =>
                inside(boxOf(parts)) || inside(boxOf([shapes])),
            ) ?? null;
          zoom(under);
          light(under);
        };
        const away = () => {
          zoom(null);
          light(null);
        };
        host.addEventListener("pointermove", pick);
        host.addEventListener("pointerover", pick);
        host.addEventListener("pointerleave", away);
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: () => {
            const vh = window.innerHeight;
            const box = groupBox();
            const through = (vh - box.top) / (vh + box.height);
            if (through >= OUT_AT) show(false);
            else if (box.top > vh * BELOW_AT) show(false);
            else if (box.bottom <= vh || box.top <= vh * 0.3) show(true);
          },
        });

        return () => {
          host.removeEventListener("pointermove", pick);
          host.removeEventListener("pointerover", pick);
          host.removeEventListener("pointerleave", away);
        };
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
