"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
          const timeline = gsap.timeline({ paused: true });
          timeline.to(
            copy,
            {
              opacity: 0,
              x: -viewBox.width * 0.08,
              duration: 0.2,
              ease: "power1.inOut",
            },
            0,
          );
          timeline.to(
            symbol,
            { x: centerShift, duration: 0.22, ease: "power2.inOut" },
            0,
          );
          timeline.to(
            symbol,
            { x: 0, duration: 0.78, ease: "power2.inOut" },
            0.22,
          );
          timeline.to(
            movement,
            { progress: 1, duration: 0.78, ease: "power2.inOut" },
            0.22,
          );
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
                duration: 0.78,
                ease: "power2.inOut",
              },
              0.22,
            );
            timeline.fromTo(
              path,
              { stroke: target.getAttribute("stroke")!, strokeWidth: 0 },
              {
                strokeWidth: 1,
                duration: 0.35,
                ease: "power1.inOut",
              },
              0.65,
            );
          });

          let start = 0,
            distance = 0,
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
          let returnTween: gsap.core.Tween | undefined;
          const x = gsap.quickSetter(link, "x", "px");
          const y = gsap.quickSetter(link, "y", "px");
          const sceneY = gsap.quickSetter(scene, "y", "px");
          const measure = () => {
            start = opening.getBoundingClientRect().bottom + window.scrollY;
            distance = Math.max(280, header.offsetHeight * 2);
            // Reserve the scroll used by the hold so no artwork is lost at the footer.
            board.style.setProperty("--brand-hold", `${distance}px`);
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
              ? Number(offset >= distance)
              : offset <= 1
                ? 0
                : gsap.utils.clamp(0, 1, offset / distance);
            timeline.progress(progress).pause();
            const state =
              progress === 0 ? "expanded" : progress === 1 ? "rail" : "travel";
            link.dataset.brandState = state;
            link.setAttribute(
              "aria-label",
              state === "expanded" ? originalLabel : returnLabel,
            );
            // Keep the original composition together until docking: no hero crop
            // or detached frame corners under a separately held header.
            const heldScroll = gsap.utils.clamp(0, distance, offset);
            sceneY(heldScroll);
            x(dx * movement.progress);
            const follow = progress === 0 ? 0 : offset - heldScroll;
            y(follow);
            // Docked, the mark rides the rail down the page but stays on it: it
            // stops above the footer, as far from the rail's end as from its edge.
            if (state === "rail") {
              const mark = link.getBoundingClientRect();
              const page = host.getBoundingClientRect();
              const past =
                mark.bottom - (page.bottom - (mark.left - page.left));
              if (past > 0) y(follow - past);
            }
            link.style.width = `${width + (railWidth - width) * movement.progress}px`;
            link.style.height = `${height + (railHeight - height) * movement.progress}px`;
            // Avoid overlapping the weather while the symbol crosses its slot.
            const movingLeft = logoLeft + dx * movement.progress;
            const movingRight =
              movingLeft + width + (railWidth - width) * movement.progress;
            const gap = Math.max(
              movingLeft - weatherRight,
              weatherLeft - movingRight,
            );
            weather.style.opacity = String(
              gsap.utils.clamp(0, 1, gap / (railWidth * 0.28)),
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
            docked.style.clipPath = `inset(${edge}px 0 0 0)`;
          };
          measure();
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
            const complete = () => {
              // Browser scroll positions may round a fractional opening height down.
              window.scrollTo({ top: Math.ceil(start), behavior: "instant" });
              ScrollTrigger.update();
              header.focus({ preventScroll: true });
              returnTween = undefined;
            };
            if (reduced) complete();
            else
              returnTween = gsap.to(window, {
                scrollTo: { y: Math.ceil(start), autoKill: true },
                duration: 0.85,
                ease: "power2.inOut",
                onComplete: complete,
              });
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
