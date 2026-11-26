"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "./edge";
import { homeEnter, gsap, HOVER, MOTION, ScrollTrigger, useGSAP } from "./gsap";

/** What is left between the halves of the title when they meet, in comp units. */
const MEET = 8;
/**
 * Where, through the section's pass across the window, the halves close in: the
 * title is then near the top edge of the window. Any later and it is out of sight.
 */
const CLOSE_AT = 0.5;
/** The halves rushing together and fading out as they go (or, played back,
 *  showing and drawing apart), quickening until they meet. */
const CLOSE_TIME = 1.1;

/** The pattern opening from its middle line: shut, open, and how long it takes. */
const SHUT = "inset(50% 0% 50% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";
const OPEN_TIME = 1.2;
/**
 * When the pattern leaves the window, it closes back to its middle line, and opens
 * again as it comes back: going down, once its bottom is above 20% of the window;
 * going up, once its top is below 80%. Most of it is out of sight by then.
 */
const PATTERN_ABOVE = 0.2;
const PATTERN_BELOW = 0.8;

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
 * Scrolling on, halfway through, the two halves rush together, fading out as they
 * go, the line drawn back into where they meet; scrolling back up past that point,
 * they show again and draw apart.
 * The pattern leaves the way it came: as it goes out of the window, up or down, it
 * closes back to its middle line, and opens again as it comes back.
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

      mm.add(MOTION, (context) => {
        const title = q<HTMLElement>("h2")[0];
        const [start, end] = q<HTMLElement>("h2 > span");
        const line = q<SVGPathElement>('[data-art="thread-line"] path')[0];
        // The line draws from both ends at once: a twin draws the right half.
        const twin = line.cloneNode() as SVGPathElement;
        line.after(twin);

        const unit = () => root.current!.getBoundingClientRect().width / 1920;
        const edge = edgeMotion(context, unit);

        const enter = gsap
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
            { clipPath: SHUT },
            {
              clipPath: OPEN,
              duration: OPEN_TIME,
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

        // The halves closing in, played forward on the way down and back on the way
        // up. The line shrinks from its middle by what the halves travel, so its ends
        // stay at the words. Measured when played, in the page's current scale.
        const lineArt = q<SVGSVGElement>('[data-art="thread-line"]')[0];
        // How far each half travels to meet the other: half the gap between them as
        // laid out (offsets ignore the motion's own transforms), less what is kept.
        const travel = () =>
          (end.offsetLeft -
            (start.offsetLeft + start.offsetWidth) -
            MEET * unit()) /
          2;
        const close = gsap
          .timeline({
            paused: true,
            defaults: { duration: CLOSE_TIME, ease: "power3.in" },
          })
          .to(start, { x: () => travel() }, 0)
          .to(end, { x: () => -travel() }, 0)
          .to(lineArt, { scaleX: 0, transformOrigin: "50% 50%" }, 0)
          // The two fade out together as they rush in, gone as they meet. On the
          // title, not its halves: their own opacity is the window-edge motion's.
          .to(title, { opacity: 0, ease: "sine.in" }, 0);

        // Where the section is, read from the page as it is (the header's hold
        // shifts the page after the opening, so a scroll position wouldn't do).
        let closed = false;
        const check = () => {
          if (enter.isActive() || enter.progress() < 1) return;
          const box = root.current!.getBoundingClientRect();
          const through =
            (window.innerHeight - box.top) / (window.innerHeight + box.height);
          const shouldClose = through >= CLOSE_AT;
          if (shouldClose === closed) return;
          closed = shouldClose;
          if (closed) close.invalidate().play();
          else close.reverse();
        };
        // Once in, the title and its line, the text and the button sink away at the window's
        // foot and rise back, like the footer.
        // The pattern's way out is its way in, played back: it closes to its middle
        // line as it leaves the window, either way, and opens again as it comes back.
        // No clip once open, so a hovered sprite rising at its top edge stays whole.
        const pattern = q<SVGSVGElement>('[data-art="thread-pattern"]')[0];
        const open = gsap.fromTo(
          pattern,
          { clipPath: SHUT },
          {
            clipPath: OPEN,
            duration: OPEN_TIME,
            ease: "power3.inOut",
            paused: true,
            immediateRender: false,
            // Set by hand at both ends: played back to its start, a tween with
            // clearProps hands back the cleared style, and the pattern would show.
            onComplete: () => pattern.style.removeProperty("clip-path"),
            onReverseComplete: () => {
              pattern.style.clipPath = SHUT;
            },
          },
        );
        let opened = true;
        const checkPattern = () => {
          if (enter.progress() < 1) return;
          const vh = window.innerHeight;
          const box = pattern.getBoundingClientRect();
          const inView =
            box.bottom >= vh * PATTERN_ABOVE && box.top <= vh * PATTERN_BELOW;
          if (inView === opened) return;
          opened = inView;
          if (inView) open.play();
          else {
            // Never played yet: it starts from open, as the entrance left it.
            if (open.progress() === 0 && !open.reversed()) open.progress(1);
            open.reverse();
          }
        };

        enter.eventCallback("onComplete", () => {
          edge.add([
            start,
            end,
            // The line between the halves goes with them, timed by the title.
            { el: lineArt, ref: start },
            ...q<HTMLElement>('[data-motion="thread-body"] p'),
            ...q<HTMLElement>('[data-motion="join"]'),
          ]);
          check();
          checkPattern();
        });
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: () => {
            check();
            checkPattern();
          },
        });

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
