"use client";

import { useRef, type ReactNode } from "react";
import { CLEAR_WORD, homeEnter, gsap, HOVER, MOTION, useGSAP } from "./gsap";

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

/** The buildings, left to right, with the role label that belongs to each. `parts`
 *  rise from the ground; `whole` is everything that dims and lights up together. */
const buildings = [
  { role: "public", parts: ["public"], whole: ["public"] },
  { role: "artists", parts: ["artists"], whole: ["artists", "artists-crown"] },
  {
    role: "state",
    parts: ["state-roof", "state-house"],
    whole: ["state-roof", "state-house"],
  },
];
/** A building once the line has run past it, and when not hovered afterwards: how
 *  much of its own colour it keeps, the rest the page's seashell. */
const DIMMED = 0.5;

/**
 * Dims a building by mixing its colours with the page behind it, rather than by
 * opacity: the buildings overlap, and a see-through building would show the parts
 * of the one behind it that it hides. Each of its groups gets one shared filter.
 * Returns a setter for how much of its own colour it keeps (1 = untouched).
 */
function colourMix(svg: SVGSVGElement, groups: Element[], paper: number[]) {
  const ns = "http://www.w3.org/2000/svg";
  const id = `roles-dim-${Math.random().toString(36).slice(2)}`;
  const filter = document.createElementNS(ns, "filter");
  filter.id = id;
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const transfer = document.createElementNS(ns, "feComponentTransfer");
  const funcs = ["R", "G", "B"].map((c) => {
    const f = document.createElementNS(ns, `feFunc${c}`);
    f.setAttribute("type", "linear");
    transfer.append(f);
    return f;
  });
  filter.append(transfer);
  svg.prepend(filter);
  groups.forEach((g) => g.setAttribute("filter", `url(#${id})`));
  const set = (keep: number) =>
    funcs.forEach((f, i) => {
      f.setAttribute("slope", String(keep));
      f.setAttribute("intercept", String((1 - keep) * paper[i]));
    });
  set(1);
  return {
    set,
    remove: () => {
      groups.forEach((g) => g.removeAttribute("filter"));
      filter.remove();
    },
  };
}

interface Segment {
  el: SVGGeometryElement;
  length: number;
  reversed: boolean; // drawn right to left in the export
}

/**
 * Roles: the violet line runs from the left edge while the actors — the public, the
 * artists, the state — rise from the ground; each name rises as the line reaches it,
 * and the motto writes itself in at the line's pace, its accented words stressed. The
 * clouds drift in from the right. Once. As the line runs past each building, the
 * building and its name dim to half; once the scene is done, hovering a building
 * lights it up again, and hovering a stressed word makes its phrase beat again.
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
            scrollTrigger: {
              trigger: root.current,
              start: homeEnter(root.current),
              once: true,
            },
            defaults: { ease: SOFT },
          })
          .timeScale(PACE);

        // The motto writes itself left to right at the line's pace: its words are
        // spread over the line's run. Words in an accent tone ("sáng tạo", "nối
        // tiếp") land larger and settle, then beat once together as the line arrives;
        // once the scene is done, hovering one beats its phrase again.
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

        const rightOf = (el: Element) =>
          new DOMPoint(el.getBoundingClientRect().right, 0).matrixTransform(
            toDrawing,
          ).x;

        // The page's seashell, as 0–1 channels, for the dimmed buildings to mix with.
        const paper = gsap.utils
          .splitColor(
            getComputedStyle(document.documentElement)
              .getPropertyValue("--seashell")
              .trim(),
          )
          .map((c) => Number(c) / 255);
        /** Each building's dimming: its colour mix, its name, and how lit it is. */
        const dims = buildings.map(({ role, whole }) => {
          const mix = colourMix(cluster, whole.map(part), paper);
          const name = q<HTMLElement>(`[data-role="${role}"]`)[0];
          const state = { keep: 1 };
          const to = (keep: number, vars: gsap.TweenVars) => {
            gsap.to(state, {
              keep,
              onUpdate: () => mix.set(state.keep),
              overwrite: true,
              ...vars,
            });
            gsap.to(name, { opacity: keep, overwrite: true, ...vars });
          };
          return { mix, to };
        });

        buildings.forEach(({ role, parts, whole }, i) => {
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
          const named = timeAt(reach(leftOf(name)));
          tl.from(name, { y: 24, opacity: 0, duration: 1.2 }, named);
          // Dims, name and all, once the line has run past its right edge, and not
          // before its name has finished rising.
          const passed = timeAt(
            reach(Math.max(...whole.map(part).map(rightOf))),
          );
          tl.call(
            () => dims[i].to(DIMMED, { duration: 0.8, ease: "power1.out" }),
            undefined,
            Math.max(passed, named + 1.2),
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

        // Hovering a building lights it up, once the scene is done; a building in
        // several pieces lights up as one, so moving between them doesn't flicker.
        const hover = window.matchMedia(HOVER);
        const off: (() => void)[] = [];
        tl.eventCallback("onComplete", () => {
          buildings.forEach(({ whole }, i) => {
            const groups = whole.map(part);
            const inside = (el: EventTarget | null) =>
              groups.some((g) => el instanceof Node && g.contains(el));
            const light = (keep: number) => (e: PointerEvent) => {
              if (!hover.matches || inside(e.relatedTarget)) return;
              dims[i].to(keep, { duration: 0.35 });
            };
            const enter = light(1);
            const leave = light(DIMMED);
            for (const g of groups) {
              g.addEventListener("pointerenter", enter);
              g.addEventListener("pointerleave", leave);
              off.push(() => {
                g.removeEventListener("pointerenter", enter);
                g.removeEventListener("pointerleave", leave);
              });
            }
          });

          // Hovering a stressed word beats its phrase (the words of one tone) once.
          const phrases = new Map<string, HTMLElement[]>();
          for (const w of stressed)
            phrases.set(w.dataset.tone!, [
              ...(phrases.get(w.dataset.tone!) ?? []),
              w,
            ]);
          for (const phrase of phrases.values()) {
            const beat = () => {
              if (!hover.matches || gsap.isTweening(phrase[0])) return;
              gsap.fromTo(
                phrase,
                { scale: 1 },
                {
                  scale: 1.14,
                  transformOrigin: "50% 70%",
                  duration: 0.35,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.inOut",
                  clearProps: CLEAR_WORD,
                },
              );
            };
            for (const w of phrase) {
              w.addEventListener("pointerenter", beat);
              off.push(() => w.removeEventListener("pointerenter", beat));
            }
          }
        });
        return () => {
          off.forEach((f) => f());
          dims.forEach((d) => d.mix.remove());
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
