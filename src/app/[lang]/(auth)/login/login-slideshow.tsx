"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { type CSSProperties, useRef, useState } from "react";
import { motionAllowed } from "@/app/[lang]/explore/explore-motion";
import { crosses } from "@/components/cross";
import type { Layer } from "@/content";
import s from "./page.module.css";

gsap.registerPlugin(useGSAP);

const HOLD = 2.5;
const STEP = 0.9;
const PILL_OPACITY = [1, 0.85, 0.65, 0.48];

type CardStatus = "active" | "prev" | "next" | "hidden";

export interface SlideItem {
  slug: string;
  code: string;
  layer: Layer;
  name: string;
  hook: string;
  cover?: string;
}

interface LoginCarouselProps {
  slides: SlideItem[];
  layerLabels: Record<Layer, string>;
  placeholder: string;
  label: string;
}

function wrapDist(i: number, index: number, n: number) {
  let d = i - index;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

function statusOf(i: number, index: number, n: number): CardStatus {
  const d = wrapDist(i, index, n);
  if (d === 0) return "active";
  if (d === -1) return "prev";
  if (d === 1) return "next";
  return "hidden";
}

function pillOpacity(d: number) {
  return PILL_OPACITY[Math.abs(d)] ?? 0;
}

function pillVars(d: number) {
  return {
    y: 0,
    yPercent: d * 100,
    autoAlpha: pillOpacity(d),
  };
}

function cardVars(status: CardStatus) {
  switch (status) {
    case "active":
      return {
        x: 0,
        y: 0,
        xPercent: 0,
        scale: 1,
        rotation: 0,
        autoAlpha: 1,
      };
    case "prev":
      return {
        x: 0,
        y: 0,
        xPercent: -20,
        scale: 0.85,
        rotation: -3,
        autoAlpha: 1,
      };
    case "next":
      return {
        x: 0,
        y: 0,
        xPercent: 20,
        scale: 0.85,
        rotation: 3,
        autoAlpha: 1,
      };
    case "hidden":
      return {
        x: 0,
        y: 0,
        xPercent: 0,
        scale: 0.7,
        rotation: 0,
        autoAlpha: 0,
      };
  }
}

function innerVars(status: CardStatus) {
  switch (status) {
    case "active":
      return { opacity: 1, filter: "grayscale(0)" };
    case "prev":
    case "next":
      return { opacity: 0.45, filter: "grayscale(1)" };
    case "hidden":
      return { opacity: 0, filter: "grayscale(1)" };
  }
}

export function LoginCarousel({
  slides,
  layerLabels,
  placeholder,
  label,
}: LoginCarouselProps) {
  const n = slides.length;
  const [pos, setPos] = useState({ index: 0, from: 0 });
  const root = useRef<HTMLDivElement>(null);
  const stepTl = useRef<gsap.core.Timeline | null>(null);
  const holdCall = useRef<gsap.core.Tween | null>(null);
  const pending = useRef<number | null>(null);
  const hovered = useRef(false);
  const keyboardFocused = useRef(false);
  const pillsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const hookRef = useRef<HTMLParagraphElement>(null);

  function go(i: number) {
    if (stepTl.current?.isActive()) {
      pending.current = i;
      return;
    }
    pending.current = null;
    setPos((p) => (p.index === i ? p : { from: p.index, index: i }));
  }

  function advance() {
    setPos((p) => ({ from: p.index, index: (p.index + 1) % n }));
  }

  useGSAP(
    () => {
      if (!motionAllowed()) return;

      if (pos.from !== pos.index) {
        const step = gsap.timeline({
          onComplete: () => {
            const next = pending.current;
            pending.current = null;
            if (next !== null && next !== pos.index) {
              setPos((p) =>
                p.index === next ? p : { from: p.index, index: next },
              );
            }
          },
        });
        stepTl.current = step;

        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          const fromStatus = statusOf(i, pos.from, n);
          const toStatus = statusOf(i, pos.index, n);
          if (fromStatus === "hidden" && toStatus === "hidden") return;
          const fromVars =
            toStatus === "hidden"
              ? cardVars(fromStatus)
              : { ...cardVars(fromStatus), autoAlpha: 1 };
          step.fromTo(
            card,
            fromVars,
            { ...cardVars(toStatus), duration: STEP, ease: "power2.inOut" },
            0,
          );
          const inner = card.firstElementChild;
          if (inner) {
            step.fromTo(
              inner,
              innerVars(fromStatus),
              { ...innerVars(toStatus), duration: STEP, ease: "power2.inOut" },
              0,
            );
          }
        });

        const delta = wrapDist(pos.index, pos.from, n);
        pillsRef.current.forEach((pill, i) => {
          if (!pill) return;
          const dFrom = wrapDist(i, pos.from, n);
          const dTo = wrapDist(i, pos.index, n);
          if (dFrom - delta === dTo) {
            if (Math.abs(dFrom) >= 4 && Math.abs(dTo) >= 4) return;
            step.fromTo(
              pill,
              pillVars(dFrom),
              { ...pillVars(dTo), duration: STEP, ease: "power2.inOut" },
              0,
            );
          } else if (Math.abs(dFrom) < 4) {
            step.fromTo(
              pill,
              pillVars(dFrom),
              {
                ...pillVars(dFrom - delta),
                duration: STEP,
                ease: "power2.inOut",
              },
              0,
            );
            step.set(pill, pillVars(dTo), STEP);
          } else if (Math.abs(dTo) < 4) {
            step.fromTo(
              pill,
              pillVars(dTo + delta),
              { ...pillVars(dTo), duration: STEP, ease: "power2.inOut" },
              0,
            );
          }
        });

        const nameEl = nameRef.current;
        const hookEl = hookRef.current;
        if (nameEl && hookEl) {
          step.fromTo(
            [nameEl, hookEl],
            { y: -16, clipPath: "inset(0 0 100% 0)" },
            {
              y: 0,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.45,
              ease: "expo.out",
              stagger: 0.05,
            },
            STEP * 0.6,
          );
        }
      }

      holdCall.current = gsap.delayedCall(HOLD, advance);
      if (hovered.current || keyboardFocused.current) {
        holdCall.current.pause();
      }

      return () => {
        stepTl.current?.kill();
        holdCall.current?.kill();
      };
    },
    { dependencies: [pos], scope: root, revertOnUpdate: true },
  );

  const currentSlide = slides[pos.index];
  const total = String(n).padStart(2, "0");

  return (
    <div
      ref={root}
      className={s.carousel}
      onPointerEnter={() => {
        hovered.current = true;
        holdCall.current?.pause();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        if (!keyboardFocused.current) {
          holdCall.current?.resume();
        }
      }}
    >
      <div
        className={s.wheel}
        role="group"
        aria-label={label}
        onFocus={(e) => {
          if (e.target.matches(":focus-visible")) {
            keyboardFocused.current = true;
            holdCall.current?.pause();
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            keyboardFocused.current = false;
            if (!hovered.current) {
              holdCall.current?.resume();
            }
          }
        }}
      >
        {slides.map((slide, i) => {
          const d = wrapDist(i, pos.index, n);
          const o = pillOpacity(d);
          return (
            <button
              key={slide.slug}
              ref={(el) => {
                pillsRef.current[i] = el;
              }}
              type="button"
              className={s.pill}
              tabIndex={Math.abs(d) >= 3 ? -1 : undefined}
              aria-current={i === pos.index ? "true" : undefined}
              data-far={Math.abs(d) >= 3 ? "" : undefined}
              data-hidden={Math.abs(d) >= 4 ? "" : undefined}
              style={{ "--d": d, "--o": o } as CSSProperties}
              onClick={() => go(i)}
            >
              <span className={s.pillBox}>
                <span className="meta">{slide.code.toUpperCase()}</span>
                {slide.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className={s.stack} aria-hidden="true">
        <div className={s.deck}>
          {slides.map((slide, i) => (
            <div
              key={slide.slug}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className={s.card}
              data-layer={slide.layer}
              data-status={statusOf(i, pos.index, n)}
            >
              <div className={s.cardInner}>
                {crosses}
                <p className={`meta ${s.cap}`}>
                  <span>
                    {slide.code.toUpperCase()} · {layerLabels[slide.layer]}
                  </span>
                  <span>
                    {String(i + 1).padStart(2, "0")} / {total}
                  </span>
                </p>
                <div className={s.figure}>
                  {slide.cover ? (
                    <Image
                      src={slide.cover}
                      alt=""
                      fill
                      sizes="(max-width: 48rem) 90vw, 30vw"
                      priority={i === 0}
                    />
                  ) : (
                    <span className={s.chip}>
                      {placeholder} · {slide.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.text}>
        <p ref={nameRef} className={s.name}>
          {currentSlide.name}
        </p>
        <p ref={hookRef} className={s.hook}>
          {currentSlide.hook}
        </p>
      </div>
    </div>
  );
}
