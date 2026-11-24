import { gsap } from "./gsap";

/** Caption travel in the source's 1920-wide composition. Also used on exit. */
export const HEADING_DRIFT = 40;

/** Shared arrival for Explore's layer headings and the map introduction. */
export function headingReveal({
  name,
  line,
  caption,
  unit,
  fromStart = true,
  toLeft = false,
}: {
  name: HTMLElement | null;
  line: SVGGeometryElement | null;
  caption: HTMLElement | null;
  unit: number;
  fromStart?: boolean;
  toLeft?: boolean;
}) {
  const timeline = gsap.timeline({
    defaults: { duration: 1.5, ease: "power2.out" },
  });

  if (name)
    timeline.fromTo(
      name,
      { yPercent: 70, clipPath: "inset(100% -10% -40% -10%)" },
      {
        yPercent: 0,
        clipPath: "inset(-70% -10% -40% -10%)",
        clearProps: "transform,clipPath",
      },
      0,
    );

  if (line)
    timeline.fromTo(
      line,
      { drawSVG: fromStart ? "0% 0%" : "100% 100%" },
      { drawSVG: "0% 100%", ease: "power2.inOut" },
      0,
    );

  if (caption)
    timeline.fromTo(
      caption,
      {
        x: (toLeft ? HEADING_DRIFT : -HEADING_DRIFT) * unit,
        clipPath: toLeft
          ? "inset(-70% 0% -40% 100%)"
          : "inset(-70% 100% -40% 0%)",
      },
      {
        x: 0,
        clipPath: "inset(-70% 0% -40% 0%)",
        clearProps: "transform,clipPath",
      },
      0.15,
    );

  return timeline;
}
