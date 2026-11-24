"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import { headingReveal } from "@/features/home/motion/heading-reveal";
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
      const section = root.current!;
      const media = gsap.matchMedia();
      media.add(
        MOTION,
        () => {
          headingReveal({
            name: section.querySelector<HTMLElement>(`.${s.heading}`),
            line: section.querySelector<SVGPathElement>(
              `.${s.headingRule} path`,
            ),
            caption: section.querySelector<HTMLElement>(`.${s.lead}`),
            unit: section.getBoundingClientRect().width / 1920,
          }).from(
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
      section.dataset.arrived = "";
      return () => media.revert();
    },
    { scope: root },
  );
  return (
    <main ref={root} id={id} className={s.intro} tabIndex={-1}>
      {children}
    </main>
  );
}
