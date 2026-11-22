"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import s from "./map.module.css";

export function MapPageMotion({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(
        MOTION,
        () => {
          gsap
            .timeline({ defaults: { ease: "power2.out" } })
            .from(`.${s.heading}`, {
              clipPath: "inset(0 0 100% 0)",
              y: 16,
              duration: 0.6,
            })
            .from(
              `.${s.headingRule}`,
              { scaleX: 0, transformOrigin: "left center", duration: 0.5 },
              0.12,
            )
            .from(`.${s.lead}`, { opacity: 0, y: 10, duration: 0.4 }, 0.22)
            .from(
              `.${s.explorer}`,
              {
                opacity: 0,
                y: 18,
                duration: 0.55,
                clearProps: "transform,opacity",
              },
              0.3,
            );
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root },
  );
  return (
    <main ref={root} id={id} tabIndex={-1}>
      {children}
    </main>
  );
}
