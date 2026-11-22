"use client";

import { useRef } from "react";
import { homeEnter, gsap, MOTION, useGSAP } from "./gsap";
import { REVEAL_CAP } from "./timing";

/**
 * A number that counts up from 0 to `to` the first time it scrolls into view. Its box
 * keeps the width of the final number, so nothing around it shifts while it counts.
 * Screen readers, and reduced motion, get the final number only.
 */
export function CountUp({ to }: { to: string }) {
  const digits = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = digits.current!;
    const target = Number(to);
    if (!Number.isInteger(target)) return;
    gsap.matchMedia().add(MOTION, () => {
      const count = { value: 0 };
      el.textContent = "0";
      gsap.to(count, {
        value: target,
        duration: REVEAL_CAP,
        ease: "power2.out",
        snap: { value: 1 },
        onUpdate: () => {
          el.textContent = String(count.value);
        },
        scrollTrigger: { trigger: el, start: homeEnter(el, 0.75), once: true },
      });
      return () => {
        el.textContent = to;
      };
    });
  });

  return (
    <>
      <span className="sr-only">{to}</span>
      <span
        ref={digits}
        aria-hidden="true"
        style={{
          display: "inline-block",
          minWidth: `${to.length}ch`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {to}
      </span>
    </>
  );
}
