"use client";

import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import type { useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/features/home/motion/gsap";
import { detailGateBox } from "./art";

gsap.registerPlugin(MorphSVGPlugin);

/** Plain rectangle covering DetailGate's exact viewBox (477.27 1428.55 260.94 234.17). */
const GATE_OPEN_RECT = `M${detailGateBox.x},${detailGateBox.y}H${+(detailGateBox.x + detailGateBox.w).toFixed(2)}V${+(detailGateBox.y + detailGateBox.h).toFixed(2)}H${detailGateBox.x}Z`;

export interface GateHandoff {
  slug: string;
  rect: { left: number; top: number; width: number; height: number };
  naturalWidth: number;
  naturalHeight: number;
  at: number;
}

/** Max age for a recorded gate hand-off before a point page ignores it. */
const HANDOFF_MAX_AGE_MS = 3000;
let pendingHandoff: GateHandoff | null = null;
/** Set whenever a gate select navigates with `scroll: false`; consumed once on arrival. */
let pendingScrollReset = false;

/** Record the chosen gate photo's viewport rect (clamped into the viewport) before pushing. */
export function saveGateHandoff(
  slug: string,
  rect: DOMRect,
  naturalWidth = 0,
  naturalHeight = 0,
) {
  const width = Math.min(rect.width, window.innerWidth);
  const height = Math.min(rect.height, window.innerHeight);
  const left = Math.max(0, Math.min(rect.left, window.innerWidth - width));
  const top = Math.max(0, Math.min(rect.top, window.innerHeight - height));
  pendingHandoff = {
    slug,
    rect: { left, top, width, height },
    naturalWidth,
    naturalHeight,
    at: Date.now(),
  };
  pendingScrollReset = true;
}

/** Consume the one-shot scroll-reset flag set by a gate select (`scroll: false` push). */
export function consumeGateScrollReset(): boolean {
  const shouldReset = pendingScrollReset;
  pendingScrollReset = false;
  return shouldReset;
}

/** Consume a fresh hand-off for `slug`, if one was recorded within 3 s. */
export function takeGateHandoff(slug: string): GateHandoff | null {
  const current = pendingHandoff;
  pendingHandoff = null;
  if (!current || current.slug !== slug) return null;
  if (Date.now() - current.at > HANDOFF_MAX_AGE_MS) return null;
  return current;
}

// Negative vertical insets keep Vietnamese diacritics above capitals and dots
// below the baseline visible (captions use text-box: cap alphabetic); negative
// horizontal insets keep wide nowrap labels from clipping at the sides.
export const LABEL_CLIPPED = "inset(-70% -50vw 170% -50vw)";
export const LABEL_SHOWN = "inset(-70% -50vw -40% -50vw)";
export const OTHER_SHOWN = "inset(-10% -50vw -40% -50vw)";
export const OTHER_CLIPPED = "inset(-10% -50vw 110% -50vw)";

export interface GateTransitionOptions {
  /** Container that receives delegated clicks on `a[data-gate-link]`. */
  scope: HTMLElement;
  router: ReturnType<typeof useRouter>;
  /** Called when an exit starts (e.g. to kill arrival or scroll timelines). */
  onExitStart?: () => void;
  /** Optional extra exit tweens (e.g. slide heading/line/caption or section header). */
  addExit?: (tl: gsap.core.Timeline, unit: number) => void;
  /** Optional extra elements to clear when resetting after Back / bfcache restore. */
  extraResetTargets?: () => Element[];
  /** Optional hook after reset (e.g. restore a DrawSVG path). */
  onReset?: () => void;
}

function restoreGateMask(gate: HTMLElement) {
  const maskSvg = gate.querySelector<SVGSVGElement>("[data-gate-mask]");
  if (maskSvg?.dataset.origBox) {
    const box = JSON.parse(maskSvg.dataset.origBox) as Record<
      string,
      string | null
    >;
    for (const [key, value] of Object.entries(box)) {
      if (value !== null) maskSvg.setAttribute(key, value);
    }
  }
  const maskPath = gate.querySelector<SVGPathElement>("[data-gate-mask] path");
  if (maskPath?.dataset.origD) {
    maskPath.setAttribute("d", maskPath.dataset.origD);
  }
}

/**
 * Shared select -> point-page transition for both `/explore` and the point page's
 * own ĐỊA gates: lifts the chosen photo immediately while opening its gate frame
 * into a plain rectangle and retracting the other gates and heading, records the
 * clamped photo rect for a content-matched FLIP, and pushes with `scroll: false`.
 */
export function attachGateTransition({
  scope,
  router,
  onExitStart,
  addExit,
  extraResetTargets,
  onReset,
}: GateTransitionOptions): () => void {
  let exiting = false;
  let exitTl: gsap.core.Timeline | null = null;
  const prefetched = new Set<string>();

  const getGates = () =>
    Array.from(scope.querySelectorAll<HTMLElement>("[data-explore-gate]"));

  const collectTargets = () => {
    const targets: Element[] = [...(extraResetTargets?.() ?? [])];
    for (const gate of getGates()) {
      targets.push(gate);
      const svg = gate.querySelector("[data-gate-svg]");
      const frame = gate.querySelector("[data-gate-frame]");
      const photo = gate.querySelector("[data-gate-photo]");
      const label = gate.querySelector("[data-gate-name]");
      if (svg) targets.push(svg);
      if (frame) targets.push(frame);
      if (photo) targets.push(photo);
      if (label) targets.push(label);
    }
    return targets;
  };

  const restoreAll = () => {
    const targets = collectTargets();
    if (targets.length) {
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "transform,clipPath,opacity" });
    }
    for (const gate of getGates()) {
      restoreGateMask(gate);
    }
  };

  const reset = () => {
    exiting = false;
    exitTl?.kill();
    exitTl = null;
    restoreAll();
    onReset?.();
    ScrollTrigger.refresh();
  };

  // Clear any leftover exit styles if this DOM was restored from Next's router cache.
  restoreAll();

  const prefetchFromEvent = (event: Event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
      "a[data-gate-link]",
    );
    if (!link || !scope.contains(link)) return;
    const href = link.getAttribute("href");
    if (!href || prefetched.has(href)) return;
    prefetched.add(href);
    router.prefetch(href);
  };

  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
      "a[data-gate-link]",
    );
    if (!link || !scope.contains(link)) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target
    ) {
      return;
    }
    const href = link.getAttribute("href");
    const slug = link.dataset.gateSlug;
    if (!href || !slug) return;

    event.preventDefault();
    if (exiting) return;
    exiting = true;

    if (!prefetched.has(href)) {
      prefetched.add(href);
      router.prefetch(href);
    }

    const unit = window.innerWidth / 1920;
    const gates = getGates();
    const chosenGate = link.closest<HTMLElement>("[data-explore-gate]");
    const others = gates.filter((g) => g !== chosenGate);
    const chosenSvg =
      chosenGate?.querySelector<SVGSVGElement>("[data-gate-svg]");
    const chosenFrame =
      chosenGate?.querySelector<SVGSVGElement>("[data-gate-frame]");
    const chosenMask =
      chosenGate?.querySelector<SVGSVGElement>("[data-gate-mask]");
    const chosenMaskPath = chosenGate?.querySelector<SVGPathElement>(
      "[data-gate-mask] path",
    );
    const chosenLabel =
      chosenGate?.querySelector<HTMLElement>("[data-gate-name]");
    const chosenPhoto =
      chosenGate?.querySelector<SVGImageElement>("[data-gate-photo]") ??
      chosenSvg ??
      link;

    const nw = Number(chosenPhoto.getAttribute("data-gate-nw")) || 0;
    const nh = Number(chosenPhoto.getAttribute("data-gate-nh")) || 0;

    onExitStart?.();
    const gateTargets = gates.flatMap((g) =>
      [
        g,
        g.querySelector("[data-gate-svg]"),
        g.querySelector("[data-gate-frame]"),
        g.querySelector("[data-gate-photo]"),
        g.querySelector("[data-gate-name]"),
      ].filter((el): el is Element => el !== null),
    );
    gsap.killTweensOf([...gateTargets, ...(extraResetTargets?.() ?? [])]);

    // Save original mask geometry once so Back / bfcache can restore the notched gate.
    if (chosenMask && !chosenMask.dataset.origBox) {
      chosenMask.dataset.origBox = JSON.stringify({
        x: chosenMask.getAttribute("x"),
        y: chosenMask.getAttribute("y"),
        width: chosenMask.getAttribute("width"),
        height: chosenMask.getAttribute("height"),
      });
    }
    if (chosenMaskPath && !chosenMaskPath.dataset.origD) {
      chosenMaskPath.dataset.origD = chosenMaskPath.getAttribute("d") ?? "";
    }

    exitTl = gsap.timeline({
      onComplete: () => {
        saveGateHandoff(slug, chosenPhoto.getBoundingClientRect(), nw, nh);
        router.push(href, { scroll: false });
      },
    });

    // Chosen photo lifts immediately (< 50 ms) while scaling up into the flight
    // and opening its lime gate into a plain rectangle.
    if (chosenSvg) {
      exitTl
        .to(
          chosenSvg,
          {
            scale: 1.04,
            transformOrigin: "50% 50%",
            duration: 0.45,
            ease: "power2.in",
          },
          0,
        )
        .to(
          chosenSvg,
          {
            y: -22 * unit,
            duration: 0.45,
            ease: "power3.out",
          },
          0,
        );
    }

    if (chosenFrame) {
      exitTl.to(
        chosenFrame,
        { opacity: 0, duration: 0.3, ease: "power2.out" },
        0,
      );
    }

    if (chosenMask) {
      exitTl.to(
        chosenMask,
        {
          attr: { x: 0, y: 0, width: detailGateBox.w, height: detailGateBox.h },
          duration: 0.42,
          ease: "power2.inOut",
        },
        0,
      );
    }

    if (chosenMaskPath) {
      exitTl.to(
        chosenMaskPath,
        {
          morphSVG: GATE_OPEN_RECT,
          duration: 0.42,
          ease: "power2.inOut",
        },
        0,
      );
    }

    if (chosenLabel) {
      exitTl.fromTo(
        chosenLabel,
        { clipPath: LABEL_SHOWN, yPercent: 0 },
        {
          clipPath: LABEL_CLIPPED,
          yPercent: -100,
          duration: 0.32,
          ease: "power2.in",
        },
        0,
      );
    }

    if (others.length) {
      exitTl.fromTo(
        others,
        { clipPath: OTHER_SHOWN, y: 0 },
        {
          clipPath: OTHER_CLIPPED,
          y: -14 * unit,
          duration: 0.4,
          stagger: 0.02,
          ease: "power2.in",
        },
        0,
      );
    }

    addExit?.(exitTl, unit);
  };

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted || exiting) {
      reset();
    }
  };

  scope.addEventListener("pointerover", prefetchFromEvent);
  scope.addEventListener("focusin", prefetchFromEvent);
  scope.addEventListener("pointerdown", prefetchFromEvent);
  scope.addEventListener("click", onClick);
  window.addEventListener("pageshow", onPageShow);

  return () => {
    scope.removeEventListener("pointerover", prefetchFromEvent);
    scope.removeEventListener("focusin", prefetchFromEvent);
    scope.removeEventListener("pointerdown", prefetchFromEvent);
    scope.removeEventListener("click", onClick);
    window.removeEventListener("pageshow", onPageShow);
    exitTl?.kill();
    exitTl = null;
    if (exiting) {
      restoreAll();
      onReset?.();
    }
    exiting = false;
  };
}
