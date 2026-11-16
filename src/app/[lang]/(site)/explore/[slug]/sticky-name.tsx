"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { motionAllowed } from "../explore-motion";
import s from "./page.module.css";

gsap.registerPlugin(useGSAP);

/** The point's name, sliding in over the story once the hero has scrolled away. */
export function StickyName({ name }: { name: string }) {
  const sentinel = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLParagraphElement>(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setScrolledPast(entry.boundingClientRect.top < 0),
    );
    observer.observe(sentinel.current!);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const shown = {
        autoAlpha: scrolledPast ? 1 : 0,
        yPercent: scrolledPast ? 0 : -100,
      };
      if (motionAllowed())
        gsap.to(bar.current, {
          ...shown,
          duration: scrolledPast ? 0.45 : 0.25,
          ease: scrolledPast ? "power3.out" : "power2.in",
          overwrite: "auto",
        });
      else gsap.set(bar.current, shown);
    },
    { dependencies: [scrolledPast] },
  );

  return (
    <>
      <span ref={sentinel} className={s.sentinel} aria-hidden="true" />
      <div className={s.stickyName}>
        {/* A repeat of the h1 for sighted readers, so it stays out of the accessibility tree. */}
        <p ref={bar} className={s.stickyBar} aria-hidden="true">
          {name}
        </p>
      </div>
    </>
  );
}
