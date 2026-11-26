"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/features/home/motion/gsap";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Lenis interpolation factor: responsive default smoothing. */
export const LENIS_LERP = 0.1;

/** Wheel distance multiplier (1:1 native wheel delta). */
export const LENIS_WHEEL_MULTIPLIER = 1.0;

let activeLenis: Lenis | null = null;

/** Current site-wide Lenis instance, or `null` under reduced motion / SSR. */
export function getLenis(): Lenis | null {
  return activeLenis;
}

/** Cancel any running Lenis scrollTo/inertia and release lock at the current scroll position. */
export function stopSmoothScroll() {
  if (!activeLenis) return;
  activeLenis.scrollTo(window.scrollY, { immediate: true, force: true });
  ScrollTrigger.update();
}

/** Programmatic instant jump that keeps Lenis and ScrollTrigger in sync. */
export function scrollToImmediate(top: number) {
  if (activeLenis) {
    activeLenis.scrollTo(top, { immediate: true, force: true });
  } else {
    window.scrollTo({ top, behavior: "instant" });
  }
  ScrollTrigger.update();
}

/**
 * Site-wide Lenis smooth scroll driven by `gsap.ticker`, mounted once in
 * `src/app/[lang]/layout.tsx`. Disabled under `prefers-reduced-motion: reduce`
 * and reacts to runtime media query changes.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      stopSmoothScroll();
    }
    activeLenis?.resize();
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    const start = () => {
      if (lenis) return;
      const instance = new Lenis({
        autoRaf: false,
        lerp: LENIS_LERP,
        wheelMultiplier: LENIS_WHEEL_MULTIPLIER,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
      });
      instance.on("scroll", ScrollTrigger.update);
      tick = (time: number) => {
        instance.raf(time * 1000);
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenis = instance;
      activeLenis = instance;
    };

    const stop = () => {
      if (!lenis) return;
      if (tick) {
        gsap.ticker.remove(tick);
        tick = null;
      }
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
      lenis = null;
    };

    const sync = () => {
      if (media.matches) stop();
      else start();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) lenis?.resize();
    };

    sync();
    media.addEventListener("change", sync);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("pageshow", onPageShow);
      stop();
    };
  }, []);

  return null;
}
