"use client";

import { useId, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToImmediate } from "@/components/smooth-scroll";
import { resolveUnscaledSize } from "./header-docking";
import {
  OPENING_REVEAL_TIMING,
  OPENING_SCROLL_VH,
  openingTransitionEnd,
} from "./opening-snap";
import { normalizeMorphPair, rawPathBounds } from "./opening-morph";
import s from "./opening-motion.module.css";
import { takeHomeEntry } from "./section-link";

gsap.registerPlugin(useGSAP, MorphSVGPlugin, ScrollTrigger);

const WORDMARK_END = OPENING_REVEAL_TIMING.wordmarkEnd;
const REVEAL_DURATION = 1 - WORDMARK_END;

function svgNode<K extends keyof SVGElementTagNameMap>(name: K) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

/** Project original Bezier anchors/control points into homepage coordinates. */
function projectRawPath(
  d: string,
  viewBox: DOMRect,
  box: DOMRect,
  origin: DOMRect,
): number[][] {
  const raw = MorphSVGPlugin.stringToRawPath(d);
  for (const segment of raw) {
    for (let i = 0; i < segment.length; i += 2) {
      segment[i] =
        box.left -
        origin.left +
        ((segment[i] - viewBox.x) * box.width) / viewBox.width;
      segment[i + 1] =
        box.top -
        origin.top +
        ((segment[i + 1] - viewBox.y) * box.height) / viewBox.height;
    }
  }
  return raw;
}

function projectPath(
  d: string,
  viewBox: DOMRect,
  box: DOMRect,
  origin: DOMRect,
) {
  return MorphSVGPlugin.rawPathToString(
    projectRawPath(d, viewBox, box, origin),
  );
}

/** The generated SVG components supply all geometry; this owns only the motion. */
export function HomeOpeningMotion({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<SVGSVGElement>(null);
  const id = `home-brand-${useId().replace(/:/g, "")}`;

  useGSAP(
    () => {
      const host = root.current;
      const svg = overlay.current;
      const opening = host?.querySelector<HTMLElement>("[data-opening]");
      const backdrop = opening?.querySelector<HTMLElement>(
        "[data-opening-backdrop]",
      );
      const board = host?.querySelector<HTMLElement>(
        '[data-home-design="web-02"]',
      );
      const source = host?.querySelector<HTMLElement>("[data-opening-origin]");
      const entry = source?.querySelector<HTMLAnchorElement>(
        "[data-opening-logo]",
      );
      const sourceArt = entry?.querySelector("svg");
      const target = host?.querySelector<SVGSVGElement>(
        "[data-header-logo] svg",
      );
      const header = target?.closest("header");
      if (
        !host ||
        !svg ||
        !opening ||
        !backdrop ||
        !board ||
        !source ||
        !entry ||
        !sourceArt ||
        !target ||
        !header
      )
        return;

      const sourceLetters = [
        ...sourceArt.querySelectorAll<SVGPathElement>("[data-brand-letter]"),
      ];
      const targetLetters = new Map(
        [...target.querySelectorAll<SVGPathElement>("[data-brand-letter]")].map(
          (path) => [path.dataset.brandLetter!, path],
        ),
      );
      // An incomplete re-export must retain the static artwork, never hide it.
      if (
        sourceLetters.length !== 17 ||
        targetLetters.size !== 17 ||
        new Set(sourceLetters.map((path) => path.dataset.brandLetter)).size !==
          17 ||
        sourceLetters.some(
          (path) => !targetLetters.has(path.dataset.brandLetter!),
        )
      )
        return;

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const definitions = svg.querySelector("[data-morph-definitions]")!;
        const blueLetters = svg.querySelector("[data-blue-letters]")!;
        const paperLetters = svg.querySelector("[data-paper-letters]")!;
        const movingLetters = svg.querySelector("[data-morph-movement]")!;
        const detailGroup = svg.querySelector("[data-brand-details]")!;
        const blueClip = svg.querySelector("[data-blue-clip]");
        const paperClip = svg.querySelector("[data-paper-clip]");
        // Imperative children belong to this media context, not a second asset store.
        const letters = sourceLetters.map((original) => {
          const key = original.dataset.brandLetter!;
          const destination = targetLetters.get(key)!;
          const path = svgNode("path");
          path.id = `${id}-${key}`;
          path.dataset.morphLetter = key;
          definitions.append(path);
          const sourceUses: SVGUseElement[] = [];
          const targetUses: SVGUseElement[] = [];
          const sourceFill = getComputedStyle(original).fill;
          const targetFill = getComputedStyle(destination).fill;
          const needsCrossfade =
            MorphSVGPlugin.stringToRawPath(original.getAttribute("d")!).length >
              1 &&
            MorphSVGPlugin.stringToRawPath(destination.getAttribute("d")!)
              .length >
              MorphSVGPlugin.stringToRawPath(original.getAttribute("d")!)
                .length;
          let targetPath: SVGPathElement | null = null;
          if (needsCrossfade) {
            targetPath = svgNode("path");
            targetPath.id = `${id}-${key}-target`;
            targetPath.dataset.morphLetterTarget = key;
            definitions.append(targetPath);
          }
          for (const [group, fill] of [
            [blueLetters, sourceFill],
            [paperLetters, targetFill],
          ] as const) {
            const use = svgNode("use");
            use.setAttribute("href", `#${path.id}`);
            use.setAttribute("fill", fill);
            group.append(use);
            sourceUses.push(use);
            if (targetPath) {
              const targetUse = svgNode("use");
              targetUse.setAttribute("href", `#${targetPath.id}`);
              targetUse.setAttribute("fill", fill);
              targetUse.style.opacity = "0";
              group.append(targetUse);
              targetUses.push(targetUse);
            }
          }
          return {
            path,
            targetPath,
            sourceUses,
            targetUses,
            source: original.getAttribute("d")!,
            target: destination.getAttribute("d")!,
          };
        });
        const details = [
          ...target.querySelectorAll<SVGPathElement>("[data-brand-detail]"),
        ].map((original) => {
          const path = original.cloneNode(true) as SVGPathElement;
          path.removeAttribute("id");
          detailGroup.append(path);
          return { path, d: original.getAttribute("d")! };
        });

        let layout: gsap.Context | undefined;
        let activeTimeline: gsap.core.Timeline | undefined;
        let scheduled = 0;
        let previousSize = "";
        // Activate the decoupled 0.7*vh scroll height before the first measurement
        // so openingEnd, sourceBox, and header-motion all read the exact same end.
        host.style.setProperty(
          "--opening-scroll-vh",
          String(OPENING_SCROLL_VH),
        );
        host.dataset.openingMotion = "active";
        const rebuild = () => {
          const origin = host.getBoundingClientRect();
          const sourceBox = source.getBoundingClientRect();
          // Measure the untransformed header slot, even while the brand link is
          // scaled for rail docking (`getBoundingClientRect` would read scaled px).
          const headerRect = header.getBoundingClientRect();
          const targetLink = target.parentElement!;
          const targetStyle = getComputedStyle(targetLink);
          const targetSvgStyle = getComputedStyle(target);
          const targetSize = resolveUnscaledSize({
            cssWidth: targetSvgStyle.width,
            cssHeight: targetSvgStyle.height,
            fallbackWidth: targetLink.offsetWidth,
            fallbackHeight: targetLink.offsetHeight,
          });
          const edge = opening.getBoundingClientRect().bottom - origin.top;
          const headerHeight = headerRect.height;
          const viewHeight = Math.max(window.innerHeight, headerHeight);
          // Project both endpoints into fixed viewport coordinates so the pinned
          // overlay never relies on scroll compensation and never leaves the viewport.
          const viewportOrigin = new DOMRect(0, 0, origin.width, viewHeight);
          const sourceViewportBox = new DOMRect(
            sourceBox.left,
            sourceBox.top - origin.top,
            sourceBox.width,
            sourceBox.height,
          );
          const targetViewportBox = new DOMRect(
            headerRect.left + parseFloat(targetStyle.left),
            parseFloat(targetStyle.top),
            targetSize.width,
            targetSize.height,
          );
          if (!origin.width || !sourceBox.width || !targetViewportBox.width)
            return;
          const size = [
            origin.width,
            edge,
            viewHeight,
            sourceViewportBox.width,
            sourceViewportBox.height,
            sourceViewportBox.left,
            sourceViewportBox.top,
            targetViewportBox.width,
            targetViewportBox.height,
            targetViewportBox.left,
            targetViewportBox.top,
          ]
            .map((n) => n.toFixed(3))
            .join(",");
          if (size === previousSize) return;
          previousSize = size;
          layout?.revert();
          layout = gsap.context(() => {
            gsap.set(svg, {
              attr: { viewBox: `0 0 ${origin.width} ${viewHeight}` },
              height: viewHeight,
            });
            gsap.set(blueClip, {
              attr: { x: 0, y: 0, width: origin.width, height: viewHeight },
            });
            gsap.set(paperClip, {
              attr: { x: 0, y: 0, width: origin.width, height: 0 },
            });
            const pairs = letters.map((letter) => {
              const sourceRaw = projectRawPath(
                letter.source,
                sourceArt.viewBox.baseVal,
                sourceViewportBox,
                viewportOrigin,
              );
              const targetRaw = projectRawPath(
                letter.target,
                target.viewBox.baseVal,
                targetViewportBox,
                viewportOrigin,
              );
              const normalized = normalizeMorphPair(sourceRaw, targetRaw);
              if (normalized.mode === "crossfade") {
                return {
                  mode: "crossfade" as const,
                  source: MorphSVGPlugin.rawPathToString(normalized.source),
                  target: MorphSVGPlugin.rawPathToString(normalized.target),
                  sourceBounds: rawPathBounds(normalized.source),
                  targetBounds: rawPathBounds(normalized.target),
                  aligned: true,
                };
              }
              return {
                mode: "morph" as const,
                source: MorphSVGPlugin.rawPathToString(normalized.source),
                target: MorphSVGPlugin.rawPathToString(normalized.target),
                aligned: normalized.aligned,
              };
            });
            const targets = pairs.map((pair) => pair.target);
            letters.forEach((letter, index) =>
              gsap.set(letter.path, { attr: { d: targets[index] } }),
            );
            // The accessible link follows the wordmark; these reads happen only at setup.
            const bounds = letters.map((letter) => letter.path.getBBox());
            const left = Math.min(...bounds.map((box) => box.x));
            const top = Math.min(...bounds.map((box) => box.y));
            const right = Math.max(...bounds.map((box) => box.x + box.width));
            const bottom = Math.max(...bounds.map((box) => box.y + box.height));
            letters.forEach((letter, index) => {
              const pair = pairs[index];
              gsap.set(letter.path, { attr: { d: pair.source } });
              if (pair.mode === "crossfade" && letter.targetPath) {
                gsap.set(letter.targetPath, { attr: { d: pair.target } });
                gsap.set(letter.sourceUses, { opacity: 1 });
                gsap.set(letter.targetUses, { opacity: 0 });
              }
            });
            details.forEach((detail) =>
              gsap.set(detail.path, {
                attr: {
                  d: projectPath(
                    detail.d,
                    target.viewBox.baseVal,
                    targetViewportBox,
                    viewportOrigin,
                  ),
                },
              }),
            );

            const timeline = gsap.timeline({
              defaults: { duration: 1, ease: "none" },
              scrollTrigger: {
                trigger: opening,
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            });
            activeTimeline = timeline;
            // Hold the destination in the viewport while the wordmark arrives.
            timeline.fromTo(board, { y: -edge }, { y: 0 }, 0);
            // Keep the navy backdrop in the viewport while it dissolves.
            timeline.fromTo(backdrop, { y: 0 }, { y: edge }, 0);
            timeline.fromTo(
              backdrop,
              { opacity: 1 },
              { opacity: 0, duration: WORDMARK_END, ease: "power1.inOut" },
              0,
            );
            // An opaque ink wipe avoids blending the wordmark into the fading ground.
            timeline.to(
              blueClip,
              { attr: { y: viewHeight, height: 0 }, duration: 0.24 },
              0.32,
            );
            timeline.to(
              paperClip,
              { attr: { height: viewHeight }, duration: 0.24 },
              0.32,
            );
            timeline.fromTo(
              board,
              { opacity: 0 },
              {
                opacity: 1,
                duration:
                  OPENING_REVEAL_TIMING.boardFadeEnd -
                  OPENING_REVEAL_TIMING.boardFadeStart,
                ease: "power1.inOut",
              },
              OPENING_REVEAL_TIMING.boardFadeStart,
            );
            timeline.fromTo(
              [...header.children].filter((child) => !child.contains(target)),
              { y: OPENING_REVEAL_TIMING.headerSlideY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration:
                  OPENING_REVEAL_TIMING.headerEnterEnd -
                  OPENING_REVEAL_TIMING.headerEnterStart,
                ease: "power2.out",
              },
              OPENING_REVEAL_TIMING.headerEnterStart,
            );
            // Keep the overlay letters stationary in viewport coordinates; only
            // the document-flow entry link tracks them across the opening scroll.
            gsap.set(movingLetters, { y: 0 });
            timeline.to(
              entry,
              {
                x: left - sourceViewportBox.left,
                y: top + edge * WORDMARK_END - sourceViewportBox.top,
                scaleX: (right - left) / sourceViewportBox.width,
                scaleY: (bottom - top) / sourceViewportBox.height,
                transformOrigin: "0 0",
                duration: WORDMARK_END,
              },
              0,
            );
            timeline.to(
              entry,
              {
                y: top + edge - sourceViewportBox.top,
                duration: REVEAL_DURATION,
              },
              WORDMARK_END,
            );
            letters.forEach((letter, index) => {
              const pair = pairs[index];
              if (pair.mode === "crossfade" && letter.targetPath) {
                const sb = pair.sourceBounds;
                const tb = pair.targetBounds;
                const sw = sb.maxX - sb.minX || 1;
                const sh = sb.maxY - sb.minY || 1;
                const tw = tb.maxX - tb.minX || 1;
                const th = tb.maxY - tb.minY || 1;
                timeline.fromTo(
                  letter.path,
                  {
                    x: 0,
                    y: 0,
                    scaleX: 1,
                    scaleY: 1,
                    svgOrigin: `${sb.minX} ${sb.minY}`,
                  },
                  {
                    x: tb.minX - sb.minX,
                    y: tb.minY - sb.minY,
                    scaleX: tw / sw,
                    scaleY: th / sh,
                    duration: WORDMARK_END,
                  },
                  0,
                );
                timeline.fromTo(
                  letter.targetPath,
                  {
                    x: sb.minX - tb.minX,
                    y: sb.minY - tb.minY,
                    scaleX: sw / tw,
                    scaleY: sh / th,
                    svgOrigin: `${tb.minX} ${tb.minY}`,
                  },
                  {
                    x: 0,
                    y: 0,
                    scaleX: 1,
                    scaleY: 1,
                    duration: WORDMARK_END,
                  },
                  0,
                );
                timeline.to(
                  letter.targetUses,
                  { opacity: 1, duration: WORDMARK_END * 0.3 },
                  WORDMARK_END * 0.2,
                );
                timeline.to(
                  letter.sourceUses,
                  { opacity: 0, duration: WORDMARK_END * 0.3 },
                  WORDMARK_END * 0.5,
                );
                return;
              }
              timeline.to(
                letter.path,
                {
                  morphSVG: {
                    shape: targets[index],
                    type: "linear",
                    shapeIndex: pair.aligned ? 0 : "auto",
                  },
                  duration: WORDMARK_END,
                },
                0,
              );
            });
            timeline.fromTo(
              detailGroup,
              { opacity: 0 },
              {
                opacity: 1,
                duration:
                  OPENING_REVEAL_TIMING.detailFadeEnd -
                  OPENING_REVEAL_TIMING.detailFadeStart,
              },
              OPENING_REVEAL_TIMING.detailFadeStart,
            );
            const syncPhase = () => {
              const progress = timeline.progress();
              const phase =
                progress === 0
                  ? "start"
                  : progress === 1
                    ? "end"
                    : progress < WORDMARK_END
                      ? "morph"
                      : "reveal";
              if (host.dataset.openingPhase !== phase) {
                host.dataset.openingPhase = phase;
                entry.tabIndex = phase === "end" ? -1 : 0;
              }
            };
            timeline.eventCallback("onUpdate", syncPhase);
            // Global refresh so HomeHeaderMotion and Home section triggers re-measure
            // after the opening's 0.7*vh scroll height takes effect.
            ScrollTrigger.refresh();
            syncPhase();
            host.dataset.openingMotion = "active";
          }, host);
        };
        const schedule = () => {
          cancelAnimationFrame(scheduled);
          scheduled = requestAnimationFrame(rebuild);
        };
        const observer = new ResizeObserver(schedule);
        rebuild();
        [host, opening, source, target, header].forEach((element) =>
          observer.observe(element),
        );
        const getOpeningEnd = () =>
          openingTransitionEnd(
            opening.getBoundingClientRect().bottom,
            window.scrollY,
          );

        // Keyboard users must never focus controls behind the fading backdrop.
        const revealFocusedContent = () => {
          const end = getOpeningEnd();
          if (window.scrollY < end) {
            scrollToImmediate(end);
            activeTimeline?.progress(1);
          }
        };
        board.addEventListener("focusin", revealFocusedContent);
        window.addEventListener("pageshow", schedule);
        return () => {
          cancelAnimationFrame(scheduled);
          observer.disconnect();
          board.removeEventListener("focusin", revealFocusedContent);
          window.removeEventListener("pageshow", schedule);
          layout?.revert();
          host.style.removeProperty("--opening-scroll-vh");
          [definitions, blueLetters, paperLetters, detailGroup].forEach(
            (group) => group.replaceChildren(),
          );
          delete host.dataset.openingMotion;
          delete host.dataset.openingPhase;
          entry.removeAttribute("tabindex");
        };
      });
      // The shared About/Explore header can navigate here while the retained home
      // DOM is hidden. Finish the requested entry after the motion is initialized;
      // otherwise Next sees the translated header at y=0 and skips anchor scrolling.
      const entryFrame = requestAnimationFrame(() => {
        // Consume after scheduling so React's development effect replay can cancel
        // the first frame without losing the navigation request.
        if (!takeHomeEntry(header.id)) return;
        scrollToImmediate(
          openingTransitionEnd(
            opening.getBoundingClientRect().bottom,
            window.scrollY,
          ),
        );
        header.focus({ preventScroll: true });
      });
      return () => {
        cancelAnimationFrame(entryFrame);
        media.revert();
      };
    },
    { scope: root, dependencies: [id], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={`${className} ${s.root}`}>
      {children}
      <svg
        ref={overlay}
        viewBox="0 0 1 1"
        className={s.overlay}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <g data-morph-definitions />
          <clipPath id={`${id}-blue`} clipPathUnits="userSpaceOnUse">
            <rect data-blue-clip x={0} y={0} width={0} height={0} />
          </clipPath>
          <clipPath id={`${id}-paper`} clipPathUnits="userSpaceOnUse">
            <rect data-paper-clip x={0} y={0} width={0} height={0} />
          </clipPath>
        </defs>
        <g data-morph-movement>
          <g clipPath={`url(#${id}-blue)`} data-blue-letters />
          <g clipPath={`url(#${id}-paper)`} data-paper-letters />
        </g>
        <g data-brand-details />
      </svg>
    </div>
  );
}
