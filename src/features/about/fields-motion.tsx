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
import { middle, pourOver } from "./pour";

/**
 * The fields, each with the icons that stand for it and the colour it pours in, taken
 * from those icons. A field is runs of the block's text, by their place among its
 * runs: 5 · lĩnh vực · thiết kế · kiến trúc · mỹ thuật · nghệ thuật · trình diễn ·
 * thủ công mỹ nghệ (in English the same, field for field).
 */
const FIELDS = [
  { icons: ["field-roof"], runs: [0, 1], colour: "#273991" },
  { icons: ["field-weave"], runs: [2], colour: "#b7262a" },
  { icons: ["field-tiers"], runs: [3], colour: "#008b86" },
  { icons: ["field-arch"], runs: [4], colour: "#cbdb2b" },
  { icons: ["field-spark", "field-line"], runs: [5, 6], colour: "#c68fff" },
  {
    icons: ["field-gate", "field-tiers-2", "field-wave"],
    runs: [7],
    colour: "#fec35a",
  },
];

/**
 * The star after thiết kế is the block's switch, as Giao thoa is the heading's:
 * clicked on, every field pours at once and stays, hovered or not; clicked again,
 * off, they all drain, the one under the pointer too.
 */
const SWITCH = "field-star";

/** An icon's drawn shapes, its layers in the order they're painted. */
const shapes = (icon: SVGSVGElement) =>
  icon.querySelectorAll("path, polygon, rect, circle, ellipse");
/**
 * Each icon's own small move, once, as its field pours (and each in turn as the star
 * switches them on). The icons built in tiers (the roof, the weave, the tiers, the
 * gate, the waves) wave up and down through their layers, one after another; their
 * layers never shift sideways. The rest have a move of their own: the arch rises from
 * its foot, the spark flares, the line draws itself again and the star swells. Nothing
 * turns.
 */
const RISE = 5; // comp units
const WAVE = { duration: 0.22, ease: "sine.inOut", yoyo: true, repeat: 1 };
/** Which layer the wave starts from: the top of a roof, the foot of a stack. */
const FROM: Record<string, "start" | "end"> = {
  "field-tiers": "end",
  "field-tiers-2": "end",
  "field-gate": "end",
};
const wave = (icon: SVGSVGElement, name: string) =>
  gsap.to(shapes(icon), {
    ...WAVE,
    y: -RISE,
    stagger: { each: 0.04, from: FROM[name] ?? "start" },
  });
const MOVES: Record<string, (icon: SVGSVGElement) => gsap.core.Animation> = {
  "field-arch": (icon) =>
    gsap.to(icon, { ...WAVE, scaleY: 1.12, transformOrigin: "50% 100%" }),
  "field-spark": (icon) =>
    gsap.to(icon, { ...WAVE, scale: 1.2, transformOrigin: "50% 50%" }),
  "field-line": (icon) =>
    gsap.fromTo(
      shapes(icon),
      { drawSVG: "0% 0%" },
      { drawSVG: "0% 100%", duration: 0.6, ease: "power2.inOut" },
    ),
  "field-star": (icon) =>
    gsap.to(icon, { ...WAVE, scale: 1.15, transformOrigin: "50% 50%" }),
};
const play = (icon: SVGSVGElement) => {
  const name = icon.getAttribute("data-art") ?? "";
  return (MOVES[name] ?? ((i) => wave(i, name)))(icon);
};
const LINE_AT = 0.95;
const LINE_DRAW = 1.2;

/** How far apart the icons start their moves as the star switches them on. */
const TURN = 0.06;

/**
 * Năm lĩnh vực. Hovering a field's icon pours its colour, at full strength, over the
 * field's words (they rest in black at 70%), in a circle growing from their middle,
 * as Mạch nối does over Hà Nội; off it, the colour drains back. Its icons each
 * make a small move as it does. The star switches them all on and off.
 * In and out, the block and its note move like the footer
 * (src/features/home/motion/edge.ts): they rise into place from the window's foot
 * and rise away at its head, and come back the way the page scrolls. The line under
 * the block, down to the timeline, first draws down from its top as the note comes
 * in (once its top is above LINE_AT of the window), then moves like the footer too.
 */
export function FieldsMotion({
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
        const edge = edgeMotion(
          context,
          () => section.getBoundingClientRect().width / 1920,
        );
        const note = section.querySelector("p")!;
        edge.add([section.querySelector("h2")!, note], { shown: false });

        // The line draws down as the note comes in, once, then moves like it.
        const line = section.querySelector<SVGSVGElement>(
          '[data-art="about-fields-line"]',
        )!;
        const draw = gsap.fromTo(
          line.querySelector("path"),
          { drawSVG: "0% 0%" },
          {
            drawSVG: "0% 100%",
            duration: LINE_DRAW,
            ease: "sine.inOut",
            paused: true,
            onComplete: () => edge.add([line]),
          },
        );
        gsap.set(line, { visibility: "visible" });
        const check = () => {
          if (draw.progress() > 0) return;
          const top = section.getBoundingClientRect().top + note.offsetTop;
          if (top < window.innerHeight * LINE_AT) draw.play();
        };
        check();
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: check });
      });

      mm.add(HOVER, () => {
        const block = root.current!.querySelector("h2")!;
        // The runs of text, as drawn (not the copy read aloud).
        const runs = [
          ...block.querySelectorAll<HTMLElement>('[aria-hidden="true"] > span'),
        ].filter((run) => run.textContent?.trim());
        // Each icon's move, played once at a time.
        const playing = new Map<Element, gsap.core.Animation>();
        const move = (icon: Element, delay = 0) => {
          if (playing.get(icon)?.isActive()) return;
          playing.set(icon, play(icon as SVGSVGElement).delay(delay));
        };
        const icons = [...block.querySelectorAll("[data-art]")];

        const cleanups: (() => void)[] = [];
        let lit = false;
        const pours = FIELDS.flatMap(({ icons, runs: at, colour }) => {
          const over = at.map((n) => runs[n]).filter(Boolean);
          const triggers = icons.flatMap((name) => [
            ...block.querySelectorAll(`[data-art="${name}"]`),
          ]);
          if (!over.length || !triggers.length) return [];
          // The field's icons all move as it pours.
          const moveAll = () => triggers.forEach((icon) => move(icon));
          triggers.forEach((t) => t.addEventListener("pointerenter", moveAll));
          cleanups.push(() =>
            triggers.forEach((t) =>
              t.removeEventListener("pointerenter", moveAll),
            ),
          );
          return [
            pourOver({
              over,
              colour,
              from: () => middle(...over),
              triggers,
              lit: () => lit,
            }),
          ];
        });

        const toggle = block.querySelector<SVGElement>(
          `[data-art="${SWITCH}"]`,
        );
        const flip = () => {
          lit = !lit;
          pours.forEach((p) => p.check(!lit));
          // Switched on, the icons move one after another, in reading order.
          if (lit) icons.forEach((icon, i) => move(icon, i * TURN));
          else if (toggle) move(toggle);
        };
        const turn = () => toggle && move(toggle);
        if (toggle) {
          toggle.style.cursor = "pointer";
          toggle.addEventListener("click", flip);
          toggle.addEventListener("pointerenter", turn);
        }
        return () => {
          cleanups.forEach((c) => c());
          playing.forEach((a) => a.progress(1).kill());
          gsap.set(icons, { clearProps: "transform" });
          pours.forEach((p) => p.destroy());
          if (toggle) {
            toggle.style.removeProperty("cursor");
            toggle.removeEventListener("click", flip);
            toggle.removeEventListener("pointerenter", turn);
          }
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
