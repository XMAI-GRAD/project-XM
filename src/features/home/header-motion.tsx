"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  getLenis,
  scrollToImmediate,
  stopSmoothScroll,
} from "@/components/smooth-scroll";
import {
  computeDockLayout,
  computeDockScale,
  dockEaseInOut,
  dockHeaderOffset,
  dockProgress,
} from "./header-docking";
import { openingTransitionEnd } from "./opening-snap";

gsap.registerPlugin(useGSAP, MorphSVGPlugin, ScrollToPlugin, ScrollTrigger);

/** Move the original home link into the rail, keeping source artwork pristine. */
export function HomeHeaderMotion({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const header = root.current;
      const board = header?.closest<HTMLElement>('[data-home-design="web-02"]');
      const host = board?.parentElement;
      const opening = host?.querySelector<HTMLElement>("[data-opening]");
      const link =
        header?.querySelector<HTMLAnchorElement>("[data-header-logo]");
      const source = link?.querySelector("svg");
      const weather = header?.querySelector<HTMLElement>(
        "[data-header-weather]",
      );
      const rail = board?.querySelector<HTMLAnchorElement>("[data-rail-logo]");
      const destination = rail?.querySelector("svg");
      const main = board?.querySelector("main");
      const frame = board?.querySelector<HTMLElement>("[data-home-frame]");
      const frameArt = frame?.querySelector("svg");
      if (
        !header ||
        !board ||
        !host ||
        !opening ||
        !link ||
        !source ||
        !weather ||
        !rail ||
        !destination ||
        !main ||
        !frame ||
        !frameArt
      )
        return;

      const media = gsap.matchMedia();
      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const reduced = !!context.conditions?.reduced;
          const flight = source.cloneNode(true) as SVGSVGElement;
          const docked = destination.cloneNode(true) as SVGSVGElement;
          // The opening reads original paths. Only the temporary flight copy morphs.
          flight.dataset.brandFlight = "";
          docked.dataset.brandDocked = "";
          docked.setAttribute("preserveAspectRatio", "none");
          flight
            .querySelectorAll("[data-brand-letter], [data-brand-detail]")
            .forEach((node) => {
              node.removeAttribute("data-brand-letter");
              node.removeAttribute("data-brand-detail");
            });
          link.append(flight, docked);
          const symbol = [
            ...flight.querySelectorAll<SVGGElement>(
              '[data-brand-part="symbol"]',
            ),
          ];
          const copy = [
            ...flight.querySelectorAll<SVGGElement>('[data-brand-part="copy"]'),
          ];
          const paths = symbol.map((part) => part.querySelector("path")!);
          const targets = [...destination.querySelectorAll("path")];
          if (
            symbol.length !== 3 ||
            copy.length !== 4 ||
            targets.length !== 3 ||
            paths.some((path) => !path)
          ) {
            flight.remove();
            docked.remove();
            return;
          }
          const originalStyle = link.getAttribute("style");
          const scene = [header, main, frame];
          const originalSceneStyles = scene.map((part) =>
            part.getAttribute("style"),
          );
          const originalHold = board.style.getPropertyValue("--brand-hold");
          const originalWeatherOpacity = weather.style.opacity;
          const originalLabel = link.getAttribute("aria-label")!;
          const returnLabel = link.dataset.brandReturnLabel ?? originalLabel;
          const viewBox = source.viewBox.baseVal;
          const railBox = destination.viewBox.baseVal;
          const boxes = [
            ...source.querySelectorAll<SVGGElement>(
              '[data-brand-part="symbol"]',
            ),
          ].map((part) => part.getBBox());
          const left = Math.min(...boxes.map((box) => box.x));
          const right = Math.max(...boxes.map((box) => box.x + box.width));
          const centerShift =
            viewBox.x + viewBox.width / 2 - (left + right) / 2;
          const movement = { progress: 0 };
          // Keep internal movement linear so the authored outer power3.out tween
          // produces one smooth, monotonic deceleration curve with no double-easing.
          const timeline = gsap.timeline({ paused: true });
          timeline.to(
            copy,
            {
              opacity: 0,
              x: -viewBox.width * 0.08,
              duration: 0.22,
              ease: "none",
            },
            0,
          );
          timeline.to(
            symbol,
            { x: centerShift, duration: 0.16, ease: "none" },
            0,
          );
          timeline.to(symbol, { x: 0, duration: 0.84, ease: "none" }, 0.16);
          timeline.to(movement, { progress: 1, duration: 1, ease: "none" }, 0);
          paths.forEach((path, index) => {
            const target = targets[index];
            const geometry = MorphSVGPlugin.stringToRawPath(
              target.getAttribute("d")!,
            );
            for (const segment of geometry) {
              for (let i = 0; i < segment.length; i += 2) {
                segment[i] += viewBox.x - railBox.x;
                segment[i + 1] += viewBox.y - railBox.y;
              }
            }
            timeline.to(
              path,
              {
                morphSVG: {
                  shape: MorphSVGPlugin.rawPathToString(geometry),
                  type: "linear",
                },
                duration: 0.9,
                ease: "none",
              },
              0.1,
            );
            timeline.fromTo(
              path,
              { stroke: target.getAttribute("stroke")!, strokeWidth: 0 },
              {
                strokeWidth: 1,
                duration: 0.35,
                ease: "none",
              },
              0.65,
            );
          });

          let start = 0,
            totalDistance = 0,
            holdDistance = 0,
            dx = 0,
            width = 0,
            height = 0,
            railWidth = 0,
            railHeight = 0,
            railEdge = 0,
            logoTop = 0,
            logoLeft = 0,
            weatherLeft = 0,
            weatherRight = 0;
          let lastState: "expanded" | "travel" | "rail" | "" = "";
          let returnTween: gsap.core.Tween | undefined;
          let returningWithLenis = false;
          gsap.set([link, flight], { transformOrigin: "0 0" });
          const x = gsap.quickSetter(link, "x", "px");
          const y = gsap.quickSetter(link, "y", "px");
          const linkScaleX = gsap.quickSetter(link, "scaleX");
          const linkScaleY = gsap.quickSetter(link, "scaleY");
          const flightScaleX = gsap.quickSetter(flight, "scaleX");
          const flightScaleY = gsap.quickSetter(flight, "scaleY");
          const sceneY = gsap.quickSetter(scene, "y", "px");
          const measure = () => {
            start = openingTransitionEnd(
              opening.getBoundingClientRect().bottom,
              window.scrollY,
            );
            const dockLayout = computeDockLayout({
              viewportHeight: window.innerHeight,
              headerHeight: header.offsetHeight,
            });
            totalDistance = dockLayout.totalDistance;
            holdDistance = dockLayout.holdDistance;
            // Reserve the scroll used by the hold so no artwork is lost at the footer.
            board.style.setProperty("--brand-hold", `${holdDistance}px`);
            const sourceRect = source.getBoundingClientRect();
            const railRect = destination.getBoundingClientRect();
            width = sourceRect.width;
            height = sourceRect.height;
            railWidth = railRect.width;
            railHeight = railRect.height;
            const linkStyle = getComputedStyle(link);
            const railStyle = getComputedStyle(rail);
            dx = parseFloat(railStyle.left) - parseFloat(linkStyle.left);
            logoTop = parseFloat(linkStyle.top);
            logoLeft = parseFloat(linkStyle.left);
            const weatherStyle = getComputedStyle(weather);
            weatherLeft = parseFloat(weatherStyle.left);
            weatherRight = weatherLeft + parseFloat(weatherStyle.width);
            railEdge = parseFloat(getComputedStyle(frameArt).top);
          };
          const sync = () => {
            const offset = window.scrollY - start;
            const progress = reduced
              ? Number(offset >= totalDistance)
              : offset <= 1
                ? 0
                : dockProgress({ offset, totalDistance });
            timeline.progress(progress).pause();
            const state =
              progress <= 0.0001
                ? "expanded"
                : progress >= 0.9999
                  ? "rail"
                  : "travel";
            if (state !== lastState) {
              lastState = state;
              link.dataset.brandState = state;
              link.setAttribute(
                "aria-label",
                state === "expanded" ? originalLabel : returnLabel,
              );
            }
            // Hold the composition briefly, then overlap the dock with the header's
            // exit while keeping the logo pinned at its constant viewport-Y slot.
            const { heldScroll, logoFollowY } = dockHeaderOffset({
              offset,
              holdDistance,
            });
            sceneY(heldScroll);
            x(dx * movement.progress);
            const {
              scaleX,
              scaleY,
              flightScaleX: invX,
              flightScaleY: invY,
            } = computeDockScale({
              progress: movement.progress,
              width,
              height,
              railWidth,
              railHeight,
            });
            linkScaleX(scaleX);
            linkScaleY(scaleY);
            flightScaleX(invX);
            flightScaleY(invY);
            y(logoFollowY);
            // Docked, the mark rides the rail down the page but stays on it: it
            // stops above the footer, as far from the rail's end as from its edge.
            if (state === "rail") {
              const mark = link.getBoundingClientRect();
              const page = host.getBoundingClientRect();
              const past =
                mark.bottom - (page.bottom - (mark.left - page.left));
              if (past > 0) y(logoFollowY - past);
            }
            // Fade weather smoothly as the logo nears its slot and keep it out
            // until the moving logo fully clears the weather's left edge.
            const movingLeft = logoLeft + dx * movement.progress;
            const movingRight = movingLeft + width * scaleX;
            const gap = Math.max(
              movingLeft - weatherRight,
              weatherLeft - movingRight,
            );
            const weatherRamp = railWidth * 1.1;
            const weatherAlpha =
              weatherRamp > 0 ? gsap.utils.clamp(0, 1, gap / weatherRamp) : 1;
            weather.style.opacity = String(
              weatherAlpha * weatherAlpha * (3 - 2 * weatherAlpha),
            );
            // Keep the colored symbol on paper. Reveal the pale version only where
            // the original lime rail actually passes behind it after release.
            const cut = gsap.utils.clamp(
              0,
              railHeight,
              railEdge + heldScroll - offset - logoTop,
            );
            const edge = reduced && cut > 0 ? railHeight : cut;
            flight.style.clipPath =
              state === "rail" ? `inset(0 0 ${height - edge}px 0)` : "none";
            const dockedInsetPct =
              railHeight > 0 ? (edge / railHeight) * 100 : 0;
            docked.style.clipPath = `inset(${dockedInsetPct}% 0 0 0)`;
          };
          measure();
          const openingObserver = new ResizeObserver(() => {
            measure();
            sync();
          });
          openingObserver.observe(opening);
          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: sync,
            onRefresh: () => {
              measure();
              sync();
            },
          });
          sync();
          link.dataset.brandMotion = "active";
          board.dataset.railMotion = "active";

          const cancelReturn = () => {
            returnTween?.kill();
            returnTween = undefined;
            if (returningWithLenis) {
              returningWithLenis = false;
              stopSmoothScroll();
            }
          };
          const returnToHeader = (event: MouseEvent) => {
            if (
              event.button !== 0 ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            cancelReturn();
            measure();
            const targetTop = Math.ceil(start);
            const complete = () => {
              returningWithLenis = false;
              returnTween = undefined;
              // Browser scroll positions may round a fractional opening height down.
              scrollToImmediate(targetTop);
              header.focus({ preventScroll: true });
            };
            if (reduced) {
              complete();
              return;
            }
            const lenis = getLenis();
            if (lenis) {
              returningWithLenis = true;
              lenis.scrollTo(targetTop, {
                duration: 0.85,
                easing: dockEaseInOut,
                lock: false,
                force: true,
                onComplete: complete,
              });
            } else {
              returnTween = gsap.to(window, {
                scrollTo: { y: targetTop, autoKill: true },
                duration: 0.85,
                ease: "power2.inOut",
                onComplete: complete,
              });
            }
          };
          link.addEventListener("click", returnToHeader);
          window.addEventListener("wheel", cancelReturn, { passive: true });
          window.addEventListener("touchstart", cancelReturn, {
            passive: true,
          });
          window.addEventListener("keydown", cancelReturn);
          window.addEventListener("resize", cancelReturn);
          return () => {
            cancelReturn();
            openingObserver.disconnect();
            link.removeEventListener("click", returnToHeader);
            window.removeEventListener("wheel", cancelReturn);
            window.removeEventListener("touchstart", cancelReturn);
            window.removeEventListener("keydown", cancelReturn);
            window.removeEventListener("resize", cancelReturn);
            flight.remove();
            docked.remove();
            if (originalStyle === null) link.removeAttribute("style");
            else link.setAttribute("style", originalStyle);
            scene.forEach((part, index) => {
              const style = originalSceneStyles[index];
              if (style === null) part.removeAttribute("style");
              else part.setAttribute("style", style);
            });
            if (originalHold)
              board.style.setProperty("--brand-hold", originalHold);
            else board.style.removeProperty("--brand-hold");
            weather.style.opacity = originalWeatherOpacity;
            link.setAttribute("aria-label", originalLabel);
            delete link.dataset.brandState;
            delete link.dataset.brandMotion;
            delete board.dataset.railMotion;
          };
        },
      );
      return () => media.revert();
    },
    { scope: root },
  );

  return (
    <header ref={root} id={id} tabIndex={-1} className={className}>
      {children}
    </header>
  );
}
