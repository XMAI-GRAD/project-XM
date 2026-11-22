"use client";

import { useRef, type ReactNode } from "react";
import { edgeMotion } from "./edge";
import {
  CLEAR_WORD,
  homeEnter,
  gsap,
  HOVER,
  MOTION,
  ScrollTrigger,
  useGSAP,
} from "./gsap";

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
/**
 * The scene leaving the window, either way: going down, once the drawing's bottom
 * is above 45% of the window; going up, once its top is below 55%: early enough
 * to see it go. It comes back in as it returns.
 */
const AWAY_ABOVE = 0.45;
const AWAY_BELOW = 0.55;
/** Seconds the line takes to run back to where it set off. */
const RETRACT = 1.4;
/** How far the buildings drift to the left on the way out, in comp units. */
const DRIFT = 240;
/** How long a name takes to fade in as the line reaches it, or out as it leaves
 *  with its building: an even fade, so it reads as one. */
const NAME_FADE = 1.6;
/** How far the clouds drift back to the right, in px (as they came in). */
const CLOUD_DRIFT = 500;

/** A stressed phrase's hover underline: not drawn yet, drawn, run on out. */
const UNDRAWN = "inset(0% 100% 0% 0%)";
const DRAWN = "inset(0% 0% 0% 0%)";
const PASSED = "inset(0% 0% 0% 100%)";

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
 * lights it up again, and hovering a stressed phrase streaks an underline through it.
 * Leaving the window, either way, it plays out: the line runs back the way it came,
 * right to left, and the buildings drift off to the left after it with their names,
 * from the state to the public, while the clouds drift back out to the right.
 * Coming back, it all returns the same way.
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
      gsap.matchMedia().add(MOTION, (context) => {
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
        // once the scene is done, hovering one underlines its phrase.
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
            // "auto": only the name's running opacity tween gives way. `true` would
            // also kill the name's part of the way out, waiting in its timeline.
            gsap.to(name, { opacity: keep, overwrite: "auto", ...vars });
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
          tl.from(name, { y: 24, duration: 1.2 }, named).from(
            name,
            { opacity: 0, duration: NAME_FADE, ease: "sine.inOut" },
            named,
          );
          // Dims, name and all, once the line has run past its right edge, and not
          // before its name has finished fading in.
          const passed = timeAt(
            reach(Math.max(...whole.map(part).map(rightOf))),
          );
          tl.call(
            () => dims[i].to(DIMMED, { duration: 0.8, ease: "power1.out" }),
            undefined,
            Math.max(passed, named + NAME_FADE),
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
        const edge = edgeMotion(
          context,
          () => root.current!.getBoundingClientRect().width / 1920,
        );
        // The way out, built once the scene is done, from where it ended.
        let out: gsap.core.Timeline | null = null;
        let away = false;
        // Played in, the scene can still sit low in the window: it waits to be
        // scrolled fully in once before it can leave, or it would go straight out.
        let armed = false;
        const leave = () => {
          const line = [...segments].reverse();
          const speed = total / RETRACT;
          const exit = gsap.timeline({ paused: true });
          let at = 0;
          for (const piece of line) {
            const duration = piece.length / speed;
            exit.fromTo(
              piece.el,
              { drawSVG: "0% 100%" },
              {
                drawSVG: piece.reversed ? "100% 100%" : "0% 0%",
                duration,
                ease: "none",
              },
              at,
            );
            at += duration;
          }
          // Right to left, as the line runs back past them, each with its name (the
          // name follows its building, as when it dims); the star with the state.
          const unit = () => root.current!.getBoundingClientRect().width / 1920;
          [...buildings].reverse().forEach(({ role, whole }, i) => {
            const at = (RETRACT * i) / buildings.length;
            const groups = whole.map(part);
            if (role === "state") groups.push(part("star"));
            const drift = { duration: 1.1, ease: "power2.in" };
            const name = q(`[data-role="${role}"]`);
            exit
              .to(groups, { x: -DRIFT, opacity: 0, ...drift }, at)
              .to(name, { x: () => -DRIFT * unit(), ...drift }, at)
              // The name fades evenly as it goes, so it is seen fading (and, played
              // back on the way in, fading in) rather than gone all at once.
              .to(
                name,
                { opacity: 0, duration: NAME_FADE * 0.75, ease: "sine.inOut" },
                at,
              );
          });
          exit.to(
            q(
              '[data-art="roles-wave"], [data-art="roles-petal"], [data-art="roles-cloud"]',
            ),
            {
              x: CLOUD_DRIFT,
              opacity: 0,
              duration: 1.6,
              ease: "power2.in",
              stagger: 0.2,
            },
            0,
          );
          return exit;
        };
        const placeScene = () => {
          if (!out) return;
          const vh = window.innerHeight;
          const box = cluster.getBoundingClientRect();
          const gone =
            box.bottom < vh * AWAY_ABOVE || box.top > vh * AWAY_BELOW;
          if (!armed) {
            if (gone) return;
            armed = true;
          }
          if (gone === away) return;
          away = gone;
          // From the scene as it now is: hovering may have lit a name up since.
          if (away) (out.progress() === 0 ? out.invalidate() : out).play();
          else out.reverse();
        };
        ScrollTrigger.create({ start: 0, end: "max", onUpdate: placeScene });

        tl.eventCallback("onComplete", () => {
          context.add(() => {
            out = leave();
          });
          placeScene();

          // The motto sinks away at the window's foot and rises back, like the
          // footer. The names don't: they leave with their buildings (below).
          edge.add([q<HTMLElement>("h2")[0]]);

          buildings.forEach(({ whole }, i) => {
            const groups = whole.map(part);
            const inside = (el: EventTarget | null) =>
              groups.some((g) => el instanceof Node && g.contains(el));
            const light = (keep: number) => (e: PointerEvent) => {
              if (!hover.matches || away || inside(e.relatedTarget)) return;
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

          // Hovering a stressed phrase (the words of one tone) streaks an underline
          // in its colour through it: drawn in from the left, and running on out to
          // the right as the pointer leaves. Hit-tested as one box over its words
          // and the gap between them, so crossing that gap doesn't redraw it.
          const motto = q<HTMLElement>("h2")[0];
          const phrases = new Map<string, HTMLElement[]>();
          for (const w of stressed)
            phrases.set(w.dataset.tone!, [
              ...(phrases.get(w.dataset.tone!) ?? []),
              w,
            ]);
          const lines = [...phrases.values()].map((phrase) => {
            const line = document.createElement("span");
            line.setAttribute("aria-hidden", "true");
            Object.assign(line.style, {
              position: "absolute",
              pointerEvents: "none",
              // The tone colours the word's inner span, not the word itself.
              background: getComputedStyle(
                phrase[0].querySelector("[class]") ?? phrase[0],
              ).color,
              clipPath: UNDRAWN,
            });
            motto.append(line);
            off.push(() => line.remove());
            return { phrase, line };
          });
          // Under the words' baseline, in the motto's own units (Phudu: the baseline
          // sits about 1.02 em down a word's box).
          const place = ({ phrase, line }: (typeof lines)[number]) => {
            const first = phrase[0];
            const last = phrase[phrase.length - 1];
            const em = parseFloat(getComputedStyle(first).fontSize);
            Object.assign(line.style, {
              left: `${first.offsetLeft}px`,
              top: `${first.offsetTop + 1.12 * em}px`,
              width: `${last.offsetLeft + last.offsetWidth - first.offsetLeft}px`,
              height: `${Math.max(1, 0.08 * em)}px`,
            });
          };
          let shown: (typeof lines)[number] | null = null;
          const streak = (next: (typeof lines)[number] | null) => {
            if (next === shown) return;
            if (shown) {
              const { line } = shown;
              gsap.to(line, {
                clipPath: PASSED,
                duration: 0.35,
                ease: "power2.in",
                overwrite: true,
                onComplete: () => {
                  line.style.clipPath = UNDRAWN;
                },
              });
            }
            shown = next;
            if (next) {
              place(next);
              gsap.to(next.line, {
                clipPath: DRAWN,
                duration: 0.45,
                ease: "power3.out",
                overwrite: true,
              });
            }
          };
          const move = (e: PointerEvent) => {
            if (!hover.matches) return;
            const under = lines.find(({ phrase }) => {
              const boxes = phrase.map((w) => w.getBoundingClientRect());
              return (
                e.clientX >= Math.min(...boxes.map((b) => b.left)) &&
                e.clientX <= Math.max(...boxes.map((b) => b.right)) &&
                e.clientY >= Math.min(...boxes.map((b) => b.top)) &&
                e.clientY <= Math.max(...boxes.map((b) => b.bottom))
              );
            });
            streak(under ?? null);
          };
          const leaveMotto = () => streak(null);
          motto.addEventListener("pointerover", move);
          motto.addEventListener("pointermove", move);
          motto.addEventListener("pointerleave", leaveMotto);
          off.push(() => {
            motto.removeEventListener("pointerover", move);
            motto.removeEventListener("pointermove", move);
            motto.removeEventListener("pointerleave", leaveMotto);
          });
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
