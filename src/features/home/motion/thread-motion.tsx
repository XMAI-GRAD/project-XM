"use client";

import { useRef, type ReactNode } from "react";
import { homeEnter, gsap, HOVER, MOTION, useGSAP } from "./gsap";

/** How far a hovered shape of the pattern rises, in comp units (it is 785 tall). */
const LIFT = 22;

type Sprite = SVGGeometryElement[];

/**
 * The pattern's sprites. The designer drew some single shapes as several paths (a
 * red arch is its body plus its crown), so paths of one colour that touch, in the
 * same half of the pattern, are one sprite and rise together.
 */
function spritesOf(shapes: SVGGeometryElement[]) {
  const sprite = new Map<SVGGeometryElement, Sprite>(
    shapes.map((s) => [s, [s]]),
  );
  const box = new Map(shapes.map((s) => [s, s.getBBox()]));
  const touch = (a: DOMRect, b: DOMRect) =>
    a.x <= b.x + b.width + 1 &&
    b.x <= a.x + a.width + 1 &&
    a.y <= b.y + b.height + 1 &&
    b.y <= a.y + a.height + 1;
  shapes.forEach((a, i) =>
    shapes.slice(i + 1).forEach((b) => {
      const one = sprite.get(a)!;
      const other = sprite.get(b)!;
      if (
        one !== other &&
        a.parentNode === b.parentNode &&
        a.getAttribute("fill") === b.getAttribute("fill") &&
        touch(box.get(a)!, box.get(b)!)
      ) {
        one.push(...other);
        other.forEach((s) => sprite.set(s, one));
      }
    }),
  );
  return sprite;
}

/**
 * Mạch nối ——— ngàn năm. The first time it scrolls into view, the two halves of the
 * title close in and the line between them draws from both ends until it joins in
 * the middle; the woven pattern opens from its centre. Once joined it stays joined.
 * Hovering the pattern lifts the sprite under the pointer — a band, an arch — whole;
 * moving on to another sprite lowers the last one and lifts the next.
 */
export function ThreadMotion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const q = gsap.utils.selector(root);

      mm.add(MOTION, () => {
        const [start, end] = q("h2 > span");
        const line = q<SVGPathElement>('[data-art="thread-line"] path')[0];
        // The line draws from both ends at once: a twin draws the right half.
        const twin = line.cloneNode() as SVGPathElement;
        line.after(twin);

        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: homeEnter(root.current),
              once: true,
            },
            defaults: { duration: 1, ease: "power3.out" },
          })
          .from(start, { x: -120, opacity: 0 }, 0)
          .from(end, { x: 120, opacity: 0 }, 0)
          .fromTo(
            line,
            { drawSVG: "0% 0%" },
            { drawSVG: "0% 50%", duration: 1.1, ease: "power2.inOut" },
            0.35,
          )
          .fromTo(
            twin,
            { drawSVG: "100% 100%" },
            { drawSVG: "50% 100%", duration: 1.1, ease: "power2.inOut" },
            0.35,
          )
          // The click as the ends meet: the drawn letters jump.
          .to(
            q("h2 svg"),
            {
              scale: 1.3,
              duration: 0.16,
              yoyo: true,
              repeat: 1,
              transformOrigin: "50% 100%",
              ease: "power2.out",
            },
            ">-0.05",
          )
          .fromTo(
            q('[data-art="thread-pattern"]'),
            { clipPath: "inset(50% 0% 50% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.2,
              ease: "power3.inOut",
              clearProps: "clipPath",
            },
            "<",
          )
          .from(
            q('[data-motion="thread-body"] p, [data-motion="join"]'),
            { y: 24, opacity: 0, stagger: 0.12, duration: 0.8 },
            "<0.3",
          );

        return () => twin.remove();
      });

      mm.add(HOVER, () => {
        const pattern = q<SVGSVGElement>('[data-art="thread-pattern"]')[0];
        // Topmost first, so the pointer finds the shape it can see.
        const shapes = q<SVGGeometryElement>(
          '[data-art="thread-pattern"] [data-part] > *',
        ).reverse();
        const sprites = spritesOf(shapes);
        let lifted: Sprite | null = null;

        // A lifted sprite is drawn on top of its own half of the pattern, or the bands
        // painted over it would crop it as it rises. Only its own half: the top half
        // still lies over the bottom one, so the weave between them holds. It goes
        // back to its own layer once it's down.
        const painted = [...shapes].reverse();
        const home = new Map(
          painted.map((s, i) => [s, { parent: s.parentNode!, i }]),
        );
        const toFront = (sprite: Sprite) =>
          [...sprite]
            .sort((a, b) => home.get(a)!.i - home.get(b)!.i)
            .forEach((s) => home.get(s)!.parent.append(s));
        const toLayer = (sprite: Sprite) =>
          sprite.forEach((s) => {
            const { parent, i } = home.get(s)!;
            const next = [...parent.children].find(
              (c) => home.get(c as SVGGeometryElement)!.i > i,
            );
            parent.insertBefore(s, next ?? null);
          });

        const rest = (sprite: Sprite | null) =>
          sprite &&
          gsap.to(sprite, {
            y: 0,
            duration: 0.6,
            ease: "power2.inOut",
            overwrite: "auto",
            onComplete: () => toLayer(sprite),
          });
        const lift = (sprite: Sprite | null) => {
          if (sprite === lifted) return;
          rest(lifted);
          lifted = sprite;
          if (sprite) toFront(sprite);
          if (sprite)
            gsap.to(sprite, {
              y: -LIFT,
              duration: 0.5,
              ease: "power2.out",
              overwrite: "auto",
            });
        };

        // Hit-test against where each shape sits at rest (a shape's own transform
        // doesn't move its local coordinates), so a lifted shape that rises out from
        // under the pointer stays the one that's hovered instead of flickering.
        const move = (e: PointerEvent) => {
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
            pattern.getScreenCTM()!.inverse(),
          );
          const shape = shapes.find((s) => s.isPointInFill(p));
          lift(shape ? sprites.get(shape)! : null);
        };
        const leave = () => lift(null);

        // pointerover too: a pointer resting where the pattern opens up gets no move.
        pattern.addEventListener("pointerover", move);
        pattern.addEventListener("pointermove", move);
        pattern.addEventListener("pointerleave", leave);
        return () => {
          pattern.removeEventListener("pointerover", move);
          pattern.removeEventListener("pointermove", move);
          pattern.removeEventListener("pointerleave", leave);
          gsap.killTweensOf(shapes);
          painted.forEach((s) => toLayer([s]));
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
