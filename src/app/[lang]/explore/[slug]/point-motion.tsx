"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useRef } from "react";
import {
  arrivalScale,
  computeArrivalFrame,
  resolveArrival,
  type Size,
} from "@/features/explore/arrival-scale";
import {
  attachGateTransition,
  consumeGateScrollReset,
  GATE_EXIT_TIMING,
  type GateHandoff,
  LABEL_CLIPPED,
  LABEL_SHOWN,
  takeGateHandoff,
} from "@/features/explore/gate-transition";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";

// Negative horizontal insets keep the clip vertical-only so wide children
// (such as centered nowrap gate captions) are never clipped at the sides.
const CLIPPED = "inset(0 -50vw 100% -50vw)";
const SHOWN = "inset(0 -50vw 0% -50vw)";
const START = "top 88%";

/**
 * The page's motion. When arriving from a gate click (fresh hand-off for this
 * slug), the hero photo runs a content-matched FLIP from the gate's opened
 * rectangle into its own place (house power2.out, 1.15 s) while the headline,
 * info bar and in-view story blocks wait until it has mostly landed. Otherwise,
 * the photo settles from 1.08 while the name, line and info bar unroll. Below
 * the fold, blocks reveal as they scroll into view and replay when scrolled back.
 */
export function PointMotion({
  slug,
  heroSize,
  className,
  children,
}: {
  slug: string;
  heroSize?: Size;
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const arrived = useRef(false);
  // Captured once per mount so React Strict Mode's double effect doesn't lose it.
  const handoffRef = useRef<GateHandoff | null | undefined>(undefined);
  const router = useRouter();

  useGSAP(
    () => {
      const article = root.current!;

      // Reset scroll before measuring [data-media] or in-view fold checks whenever
      // we arrived via a gate select (`router.push(..., { scroll: false })`).
      if (consumeGateScrollReset()) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      gsap.matchMedia().add(MOTION, () => {
        // Attach the gate transition first so any stale exit styles from Next's
        // router cache are cleared before reveal tweens set their initial clips.
        const gatesSection =
          article.querySelector<HTMLElement>("[data-point-gates]");
        const layerLineSvg =
          article.querySelector<SVGSVGElement>("[data-layer-line]");
        const layerLine =
          layerLineSvg?.querySelector<SVGGeometryElement>("path, line") ?? null;
        let detachTransition: (() => void) | null = null;
        if (gatesSection) {
          const header =
            gatesSection.querySelector<HTMLElement>("[data-gate-header]");
          detachTransition = attachGateTransition({
            scope: gatesSection,
            router,
            addExit: (tl) => {
              if (header) {
                tl.fromTo(
                  header,
                  { clipPath: LABEL_SHOWN, yPercent: 0 },
                  {
                    clipPath: LABEL_CLIPPED,
                    yPercent: -60,
                    duration: GATE_EXIT_TIMING.heading,
                    ease: "power2.in",
                  },
                  0,
                );
              }
            },
            extraResetTargets: () => (header ? [header] : []),
            onReset: () => {
              if (layerLine) {
                gsap.killTweensOf(layerLine);
                gsap.set(layerLine, { drawSVG: "0% 100%" });
              }
            },
          });
        }

        let arrivalTl: gsap.core.Timeline | null = null;
        let handoffRevealAt = 0;

        // Cache Components keeps visited pages alive and re-runs this effect on
        // show, so a fresh gate click must re-arm the flight on a revisit.
        const next = resolveArrival(
          { arrived: arrived.current, handoff: handoffRef.current },
          takeGateHandoff(slug),
        );
        arrived.current = next.arrived;
        handoffRef.current = next.handoff;

        if (!arrived.current) {
          const handoff = handoffRef.current;
          const media = article.querySelector<HTMLElement>("[data-media]");
          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              arrived.current = true;
              handoffRef.current = null;
            },
          });
          arrivalTl = tl;

          let revealAt = 0.1;
          let cellsAt = 0.45;

          if (handoff && media) {
            const heroRect = media.getBoundingClientRect();
            const gateRect = handoff.rect;
            if (heroRect.width > 0 && heroRect.height > 0) {
              const img = media.querySelector<HTMLImageElement>("img");

              // Match cover content scale across the swap using the destination hero's
              // content dimensions so an unloaded detail photo never falls back to the
              // gate cover's aspect ratio and re-zooms on decode.
              const scale = arrivalScale({
                gateRect,
                heroRect,
                heroPhoto: heroSize,
                loaded: img
                  ? { width: img.naturalWidth, height: img.naturalHeight }
                  : undefined,
                handoff: {
                  width: handoff.naturalWidth,
                  height: handoff.naturalHeight,
                },
              });

              // Morph the visible frame linearly from gateRect (~1.11:1) to heroRect
              // (~1.62:1) while the photo scales uniformly (`object-fit: cover`).
              // Computing clipPath per frame avoids Chrome's `inset()` shorthand
              // canonicalization freezing CSS string interpolation.
              const applyFrame = (progress: number) => {
                const frame = computeArrivalFrame({
                  gateRect,
                  heroRect,
                  startScale: scale,
                  progress,
                });
                gsap.set(media, {
                  x: frame.x,
                  y: frame.y,
                  scale: frame.scale,
                  clipPath: frame.clipPath,
                  transformOrigin: "50% 50%",
                  zIndex: 10,
                });
                return frame;
              };

              const initialFrame = applyFrame(0);
              if (initialFrame.expanded) {
                gsap.set(media, {
                  position: "absolute",
                  left: (heroRect.width - initialFrame.boxWidth) / 2,
                  top: (heroRect.height - initialFrame.boxHeight) / 2,
                  width: initialFrame.boxWidth,
                  height: initialFrame.boxHeight,
                });
              }

              const flight = { p: 0 };
              tl.to(
                flight,
                {
                  p: 1,
                  duration: 1.15,
                  ease: "power2.out",
                  onUpdate: () => {
                    applyFrame(flight.p);
                  },
                  onComplete: () => {
                    gsap.set(media, {
                      clearProps:
                        "position,left,top,width,height,transform,clipPath,zIndex",
                    });
                  },
                },
                0,
              );
              // Headline, info bar and in-view story blocks follow once the photo has mostly landed.
              revealAt = 0.52;
              cellsAt = 0.65;
              handoffRevealAt = revealAt;
            }
          } else {
            tl.fromTo(
              "[data-media]",
              { scale: 1.08 },
              { scale: 1, duration: 1.2, clearProps: "transform" },
              0,
            );
          }

          tl.fromTo(
            "[data-reveal]",
            { clipPath: CLIPPED, yPercent: -100 },
            {
              clipPath: SHOWN,
              yPercent: 0,
              duration: 0.7,
              stagger: 0.12,
              clearProps: "clipPath,transform",
            },
            revealAt,
          )
            .fromTo(
              "[data-cell]",
              { clipPath: CLIPPED },
              {
                clipPath: SHOWN,
                duration: 0.6,
                stagger: 0.08,
                clearProps: "clipPath",
              },
              cellsAt,
            )
            .fromTo(
              "[data-cell] > *",
              { y: -20 },
              { y: 0, duration: 0.6, stagger: 0.04, clearProps: "transform" },
              cellsAt,
            );
        }

        const fold = window.innerHeight * 0.88;
        let inViewWipeIndex = 0;

        gsap.utils.toArray<HTMLElement>("[data-unroll]").forEach((el) => {
          // The parent, because the slide would move this element's own start point.
          const parent = el.parentElement!;
          const delay = [...parent.children].indexOf(el) * 0.08;
          if (
            arrivalTl &&
            handoffRevealAt > 0 &&
            parent.getBoundingClientRect().top < fold
          ) {
            arrivalTl.fromTo(
              el,
              { clipPath: CLIPPED, yPercent: -100 },
              {
                clipPath: SHOWN,
                yPercent: 0,
                duration: 0.6,
                ease: "power3.out",
                clearProps: "clipPath,transform",
              },
              handoffRevealAt + delay,
            );
          } else {
            gsap.fromTo(
              el,
              { clipPath: CLIPPED, yPercent: -100 },
              {
                clipPath: SHOWN,
                yPercent: 0,
                duration: 0.6,
                ease: "power3.out",
                delay,
                scrollTrigger: {
                  trigger: parent,
                  start: START,
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        });

        gsap.utils.toArray<HTMLElement>("[data-wipe]").forEach((el) => {
          if (
            arrivalTl &&
            handoffRevealAt > 0 &&
            el.getBoundingClientRect().top < fold
          ) {
            arrivalTl.fromTo(
              el,
              { clipPath: CLIPPED },
              {
                clipPath: SHOWN,
                duration: 0.8,
                ease: "power3.out",
                clearProps: "clipPath",
              },
              handoffRevealAt + inViewWipeIndex * 0.08,
            );
            inViewWipeIndex++;
          } else {
            gsap.fromTo(
              el,
              { clipPath: CLIPPED },
              {
                clipPath: SHOWN,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: START,
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        });

        if (layerLineSvg && layerLine) {
          gsap.fromTo(
            layerLine,
            { drawSVG: "0% 0%" },
            {
              drawSVG: "0% 100%",
              duration: 1.5,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: layerLineSvg,
                start: START,
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        return () => {
          detachTransition?.();
        };
      });

      // Lifts the CSS that holds content back until this first paint (page.module.css).
      article.dataset.arrived = "";
    },
    { scope: root },
  );

  return (
    <article ref={root} className={className}>
      {children}
    </article>
  );
}
