"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "@/features/home/motion/edge";
import {
  gsap,
  HOVER,
  MOTION,
  ScrollTrigger,
  useGSAP,
} from "@/features/home/motion/gsap";
import { LEFT, OPEN, RIGHT, type Way } from "./spread";

/**
 * The three roles come down like a stair, one step after another, each the same way:
 * its name spreads out to the left from the hook under it, its mark following; the
 * hook draws down and on to the right, and the text spreads out to the right from it.
 * After the last, the long line on the right flows down towards the fields.
 */
const STEP = 0.35; // from one role's start to the next
const SPREAD = 0.8;
const TRAVEL = 40; // comp units
const MARK_AT = 0.15;
const HOOK_AT = 0.2;
const HOOK_DRAW = 0.45;
const BODY_AT = 0.45;
const LINE_AFTER = 0.2; // after the last role's text starts
const LINE_DRAW = 1.1;

/**
 * They come in the first time the roles are in the window: the first name's top
 * above this share of it, the last text's foot below this one. From then on each
 * part has the footer's motion (src/features/home/motion/edge.ts): it sinks away at
 * the window's foot and rises away at its head, and comes back the way the page
 * scrolls.
 */
const IN_BELOW = 0.85;
const IN_ABOVE = 0.15;

/** Hovering a role's name grows its text, out to the right from its left edge. */
const GROW = 1.2;
const GROW_TIME = 0.4;
const SHRINK_TIME = 0.35;

/** Ba việc chúng tôi làm: the three roles, one after another, and the line after. */
export function WorkMotion({
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
      mm.add(MOTION, (context) => {
        const section = root.current!;
        const list = section.querySelector("ol")!;
        const roles = gsap.utils.toArray<HTMLElement>(list.children);
        const line = section.querySelector<SVGPathElement>(
          '[data-art="about-work-line"] path',
        )!;
        const step = () =>
          (TRAVEL * section.getBoundingClientRect().width) / 1920;

        const play = gsap.timeline({ paused: true });
        const spread = (el: Element, way: Way, at: number) =>
          play.fromTo(
            el,
            { x: () => -way.x * step(), clipPath: way.from },
            {
              x: 0,
              clipPath: OPEN,
              duration: SPREAD,
              ease: "sine.inOut",
            },
            at,
          );
        roles.forEach((role, i) => {
          const [mark, hook] = role.querySelectorAll("svg");
          const at = i * STEP;
          spread(role.querySelector("h3")!, LEFT, at);
          spread(mark, LEFT, at + MARK_AT);
          play.fromTo(
            hook.querySelector("path"),
            { drawSVG: "0% 0%" },
            { drawSVG: "0% 100%", duration: HOOK_DRAW, ease: "power1.inOut" },
            at + HOOK_AT,
          );
          spread(role.querySelector("p")!, RIGHT, at + BODY_AT);
        });
        play.fromTo(
          line,
          { drawSVG: "0% 0%" },
          { drawSVG: "0% 100%", duration: LINE_DRAW, ease: "sine.inOut" },
          (roles.length - 1) * STEP + BODY_AT + LINE_AFTER,
        );

        // Everything now waits where it arrives from: it can show.
        gsap.set([...roles, line.ownerSVGElement], { visibility: "visible" });

        const first = roles[0].querySelector("h3")!;
        const last = roles[roles.length - 1].querySelector("p")!;
        // Once in, every part moves like the footer.
        const edge = edgeMotion(
          context,
          () => section.getBoundingClientRect().width / 1920,
        );
        play.eventCallback("onComplete", () =>
          edge.add([
            ...roles.flatMap((role) => [
              ...role.querySelectorAll<SVGElement>("svg"),
              role.querySelector("h3")!,
              role.querySelector("p")!,
            ]),
            line.ownerSVGElement!,
          ]),
        );

        const check = () => {
          if (play.progress() > 0) return;
          // As laid out on the section (offsets ignore the motion's own transforms).
          const top = section.getBoundingClientRect().top;
          if (
            top + first.offsetTop < window.innerHeight * IN_BELOW &&
            top + last.offsetTop + last.offsetHeight >
              window.innerHeight * IN_ABOVE
          )
            play.play();
        };
        check();
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: check });
      });

      mm.add(HOVER, () => {
        const roles = gsap.utils.toArray<HTMLElement>(
          root.current!.querySelectorAll("ol > li"),
        );
        const cleanups = roles.map((role) => {
          const name = role.querySelector("h3")!;
          const body = role.querySelector("p")!;
          const grow = () =>
            gsap.to(body, {
              scale: GROW,
              transformOrigin: "0% 50%",
              duration: GROW_TIME,
              ease: "power2.out",
              overwrite: "auto",
            });
          const shrink = () =>
            gsap.to(body, {
              scale: 1,
              transformOrigin: "0% 50%",
              duration: SHRINK_TIME,
              ease: "power2.inOut",
              overwrite: "auto",
            });
          name.addEventListener("pointerenter", grow);
          name.addEventListener("pointerleave", shrink);
          return () => {
            name.removeEventListener("pointerenter", grow);
            name.removeEventListener("pointerleave", shrink);
            gsap.set(body, { scale: 1 });
          };
        });
        return () => cleanups.forEach((c) => c());
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
