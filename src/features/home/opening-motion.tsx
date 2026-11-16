"use client";

import { useId, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import s from "./opening-motion.module.css";

gsap.registerPlugin(useGSAP, MorphSVGPlugin, ScrollTrigger);

const WORDMARK_END = 0.72;
const REVEAL_DURATION = 1 - WORDMARK_END;

function svgNode<K extends keyof SVGElementTagNameMap>(name: K) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

/** Project original Bezier anchors/control points into homepage coordinates. */
function projectPath(
  d: string,
  viewBox: DOMRect,
  box: DOMRect,
  origin: DOMRect,
) {
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
  return MorphSVGPlugin.rawPathToString(raw);
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
          for (const [group, fill] of [
            [blueLetters, getComputedStyle(original).fill],
            [paperLetters, getComputedStyle(destination).fill],
          ] as const) {
            const use = svgNode("use");
            use.setAttribute("href", `#${path.id}`);
            use.setAttribute("fill", fill);
            group.append(use);
          }
          return {
            path,
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
        let scheduled = 0;
        let previousSize = "";
        const rebuild = () => {
          const origin = host.getBoundingClientRect();
          const sourceBox = source.getBoundingClientRect();
          // Measure the final logo relative to its header. The header may now be
          // sticky, independently of the board's opening-reveal translation.
          const headerRect = header.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const targetBox = new DOMRect(
            targetRect.x,
            origin.top + board.offsetTop + targetRect.y - headerRect.top,
            targetRect.width,
            targetRect.height,
          );
          const edge = opening.getBoundingClientRect().bottom - origin.top;
          const headerHeight = headerRect.height;
          const height = board.offsetTop + headerHeight;
          if (!origin.width || !sourceBox.width || !targetBox.width) return;
          const size = [
            origin.width,
            edge,
            height,
            sourceBox.width,
            sourceBox.height,
            sourceBox.left - origin.left,
            sourceBox.top - origin.top,
            targetBox.width,
            targetBox.height,
            targetBox.left - origin.left,
            targetBox.top - origin.top,
          ]
            .map((n) => n.toFixed(3))
            .join(",");
          if (size === previousSize) return;
          previousSize = size;
          layout?.revert();
          layout = gsap.context(() => {
            gsap.set(svg, {
              attr: { viewBox: `0 0 ${origin.width} ${height}` },
              height,
            });
            gsap.set(blueClip, {
              attr: { x: 0, y: 0, width: origin.width, height },
            });
            gsap.set(paperClip, {
              attr: { x: 0, y: 0, width: origin.width, height: 0 },
            });
            const targets = letters.map((letter) =>
              projectPath(
                letter.target,
                target.viewBox.baseVal,
                targetBox,
                origin,
              ),
            );
            letters.forEach((letter, index) =>
              gsap.set(letter.path, { attr: { d: targets[index] } }),
            );
            // The accessible link follows the wordmark; these reads happen only at setup.
            const bounds = letters.map((letter) => letter.path.getBBox());
            const left = Math.min(...bounds.map((box) => box.x));
            const top = Math.min(...bounds.map((box) => box.y));
            const right = Math.max(...bounds.map((box) => box.x + box.width));
            const bottom = Math.max(...bounds.map((box) => box.y + box.height));
            letters.forEach((letter) =>
              gsap.set(letter.path, {
                attr: {
                  d: projectPath(
                    letter.source,
                    sourceArt.viewBox.baseVal,
                    sourceBox,
                    origin,
                  ),
                },
              }),
            );
            details.forEach((detail) =>
              gsap.set(detail.path, {
                attr: {
                  d: projectPath(
                    detail.d,
                    target.viewBox.baseVal,
                    targetBox,
                    origin,
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
            // Hold the destination in the viewport while the wordmark arrives.
            timeline.fromTo([board, detailGroup], { y: -edge }, { y: 0 }, 0);
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
              { attr: { y: height, height: 0 }, duration: 0.24 },
              0.32,
            );
            timeline.to(paperClip, { attr: { height }, duration: 0.24 }, 0.32);
            timeline.fromTo(
              board,
              { opacity: 0 },
              { opacity: 1, duration: REVEAL_DURATION, ease: "power1.inOut" },
              WORDMARK_END,
            );
            timeline.fromTo(
              [...header.children].filter((child) => !child.contains(target)),
              { y: -headerHeight },
              { y: 0, duration: REVEAL_DURATION, ease: "power2.out" },
              WORDMARK_END,
            );
            // Finish the shape early, then cancel the remaining native scroll so
            // the settled lettering stays still while the header/content reveal.
            const remainingScroll = edge * REVEAL_DURATION;
            timeline.fromTo(
              movingLetters,
              { y: 0 },
              { y: -remainingScroll, duration: WORDMARK_END },
              0,
            );
            timeline.to(
              movingLetters,
              { y: 0, duration: REVEAL_DURATION },
              WORDMARK_END,
            );
            timeline.to(
              entry,
              {
                x: left - (sourceBox.left - origin.left),
                y: top - (sourceBox.top - origin.top) - remainingScroll,
                scaleX: (right - left) / sourceBox.width,
                scaleY: (bottom - top) / sourceBox.height,
                transformOrigin: "0 0",
                duration: WORDMARK_END,
              },
              0,
            );
            timeline.to(
              entry,
              {
                y: top - (sourceBox.top - origin.top),
                duration: REVEAL_DURATION,
              },
              WORDMARK_END,
            );
            letters.forEach((letter, index) =>
              timeline.to(
                letter.path,
                {
                  morphSVG: { shape: targets[index], type: "linear" },
                  duration: WORDMARK_END,
                },
                0,
              ),
            );
            timeline.fromTo(
              detailGroup,
              { opacity: 0 },
              { opacity: 1, duration: REVEAL_DURATION },
              WORDMARK_END,
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
            timeline.scrollTrigger?.refresh();
            timeline.scrollTrigger?.update();
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
        // Keyboard users must never focus controls behind the fading backdrop.
        const revealFocusedContent = () => {
          const end = opening.getBoundingClientRect().bottom + window.scrollY;
          if (window.scrollY < end) {
            window.scrollTo({ top: end, behavior: "instant" });
            ScrollTrigger.update();
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
          [definitions, blueLetters, paperLetters, detailGroup].forEach(
            (group) => group.replaceChildren(),
          );
          delete host.dataset.openingMotion;
          delete host.dataset.openingPhase;
          entry.removeAttribute("tabindex");
        };
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [id], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={`${className} ${s.root}`}>
      {children}
      <svg
        ref={overlay}
        className={s.overlay}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <g data-morph-definitions />
          <clipPath id={`${id}-blue`} clipPathUnits="userSpaceOnUse">
            <rect data-blue-clip />
          </clipPath>
          <clipPath id={`${id}-paper`} clipPathUnits="userSpaceOnUse">
            <rect data-paper-clip />
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
