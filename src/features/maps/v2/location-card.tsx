"use client";

import Image from "next/image";
import Link from "next/link";
import { pointHref } from "@/features/explore/paths";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { DesignMapPoint } from "./types";
import s from "./map.module.css";

export interface LocationCardControls {
  dismiss: (complete: () => void) => void;
  cancelDismiss: () => void;
}
type CardProps = {
  point: DesignMapPoint;
  layerName: string;
  lang: Locale;
  id: string;
  titleId: string;
  titleRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
  onRoute: () => void;
  ui: Dictionary["maps"];
};

/** Keep the source frame in place while the selected location crossfades. */
export function LocationCard({
  ref,
  ...props
}: CardProps & { ref: Ref<LocationCardControls> }) {
  const root = useRef<HTMLElement>(null);
  const controls = useRef<LocationCardControls | null>(null);
  const [content, setContent] = useState<{
    current: DesignMapPoint;
    previous: DesignMapPoint | null;
  }>({ current: props.point, previous: null });
  if (content.current.slug !== props.point.slug)
    setContent({ current: props.point, previous: content.current });

  useImperativeHandle(
    ref,
    () => ({
      dismiss: (complete) => controls.current?.dismiss(complete),
      cancelDismiss: () => controls.current?.cancelDismiss(),
    }),
    [],
  );
  useGSAP(
    () => {
      const card = root.current!;
      const current = card.querySelector<HTMLElement>("[data-card-current]")!;
      const ghost = card.querySelector<HTMLElement>("[data-card-ghost]");
      // A new location starts at its header, even after reading a longer card.
      current.querySelector<HTMLElement>(`.${s.cardReading}`)!.scrollTop = 0;
      const media = gsap.matchMedia();
      media.add(
        { motion: MOTION, reduced: "(prefers-reduced-motion: reduce)" },
        (context) => {
          let exit: gsap.core.Timeline | undefined;
          let completeExit: (() => void) | undefined;
          const entrance = gsap.timeline();
          if (context.conditions?.motion) {
            if (ghost) {
              entrance
                .fromTo(
                  ghost,
                  { opacity: 1 },
                  { opacity: 0, duration: 0.22 },
                  0,
                )
                .from(
                  current,
                  { opacity: 0, duration: 0.26, ease: "power1.out" },
                  0,
                );
            } else {
              entrance
                .from(
                  card,
                  {
                    clipPath: "inset(0 0 100% 0)",
                    opacity: 0,
                    duration: 0.38,
                    ease: "power3.out",
                  },
                  0,
                )
                .from(
                  current.querySelector(`.${s.cardPhoto}`),
                  { opacity: 0, y: -8, duration: 0.3 },
                  0.08,
                )
                .from(
                  current.querySelector(`.${s.cardHeading}`),
                  { opacity: 0, y: 8, duration: 0.3 },
                  0.17,
                )
                .from(
                  current.querySelector(`.${s.cardQuote}`),
                  { opacity: 0, y: 6, duration: 0.25 },
                  0.25,
                )
                .from(
                  current.querySelectorAll(
                    `.${s.cardExplore}, .${s.cardBadge}, .${s.cardDirections}`,
                  ),
                  { opacity: 0, y: 4, duration: 0.22, stagger: 0.035 },
                  0.32,
                );
            }
          }
          const dismiss = context.add("dismiss", (complete: () => void) => {
            completeExit = complete;
            if (exit) return;
            if (!context.conditions?.motion) {
              completeExit = undefined;
              complete();
              return;
            }
            entrance.progress(1);
            exit = gsap
              .timeline({
                onComplete: () => {
                  const finish = completeExit;
                  completeExit = undefined;
                  finish?.();
                },
              })
              .to(current, {
                opacity: 0,
                y: -6,
                duration: 0.13,
                ease: "power1.in",
              })
              .to(
                card,
                {
                  clipPath: "inset(0 0 100% 0)",
                  opacity: 0,
                  duration: 0.15,
                  ease: "power2.in",
                },
                0.07,
              );
          });
          controls.current = {
            dismiss: (complete) => dismiss(complete),
            cancelDismiss: () => {
              completeExit = undefined;
              exit?.revert();
              exit = undefined;
            },
          };
          return () => {
            controls.current = null;
            // A preference change must not leave a closing card stranded on screen.
            if (!window.matchMedia(MOTION).matches) completeExit?.();
          };
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root, dependencies: [props.point.slug], revertOnUpdate: true },
  );

  useEffect(() => {
    const heading = root.current?.querySelector<HTMLHeadingElement>(
      "[data-card-current] h3",
    );
    heading?.focus({ preventScroll: true });
    if (root.current && getComputedStyle(root.current).position === "relative")
      root.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [props.point.slug]);

  return (
    <article
      ref={root}
      id={props.id}
      aria-labelledby={props.titleId}
      className={s.locationCard}
      data-layer={props.point.layer}
      data-code={props.point.code}
      lang={props.lang}
    >
      <div className={s.cardBody}>
        {content.previous && (
          <div
            className={s.cardContent}
            data-card-ghost=""
            data-layer={content.previous.layer}
            data-code={content.previous.code}
            lang={props.lang}
            aria-hidden="true"
            inert
          >
            <CardContent
              {...props}
              key={content.previous.slug}
              point={content.previous}
              titleId={undefined}
              titleRef={undefined}
            />
          </div>
        )}
        <div
          className={s.cardContent}
          data-card-current=""
          data-layer={props.point.layer}
          data-code={props.point.code}
          lang={props.lang}
        >
          <CardContent {...props} key={props.point.slug} />
        </div>
      </div>
      <button
        type="button"
        className={s.cardClose}
        aria-label={props.ui.closeCard}
        onClick={props.onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/maps/v2/card-close.svg" alt="" />
      </button>
    </article>
  );
}

function CardContent({
  point,
  layerName,
  lang,
  titleId,
  titleRef,
  onRoute,
  ui,
}: Omit<CardProps, "titleId" | "titleRef"> & {
  titleId?: string;
  titleRef?: Ref<HTMLHeadingElement>;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <>
      <p className={s.cardMeta}>
        <span>
          {point.code.toUpperCase()} / {layerName}
        </span>
        <span>{ui.selectedPlace}</span>
      </p>
      <div
        className={s.cardReading}
        data-card-reading=""
        tabIndex={0}
        aria-label={point.name}
      >
        <div className={s.cardReadingBody}>
          <div className={s.cardReadingContent}>
            <div className={s.cardPhoto}>
              {point.photo && !imageFailed ? (
                <div
                  className={s.cardPhotoFraming}
                  style={
                    point.photo.frame
                      ? {
                          left: `${point.photo.frame.x * 100}%`,
                          top: `${point.photo.frame.y * 100}%`,
                          width: `${point.photo.frame.width * 100}%`,
                          height: `${point.photo.frame.height * 100}%`,
                        }
                      : undefined
                  }
                >
                  <Image
                    className={s.cardPhotoImage}
                    src={point.photo.src}
                    alt={point.photo.alt}
                    fill
                    loading="eager"
                    sizes="(max-width: 1200px) 420px, 22vw"
                    // SVG images default to xMidYMid meet inside their authored box.
                    style={
                      point.photo.frame ? { objectFit: "contain" } : undefined
                    }
                    onError={() => setImageFailed(true)}
                  />
                </div>
              ) : (
                <span className={s.cardPhotoUnavailable}>
                  {ui.imageUnavailable}
                </span>
              )}
              <span className={s.cardPhotoTheme} aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/maps/v2/pin-${point.layer}.svg`} alt="" />
                {point.code.toUpperCase()}
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={s.cardPhotoRule}
              src="/maps/v2/card-photo-rule.svg"
              alt=""
              aria-hidden="true"
            />
            <div className={s.cardHeading}>
              <h3
                id={titleId}
                ref={titleRef}
                tabIndex={-1}
                aria-label={point.name}
              >
                {point.headline.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </h3>
              <p className={s.cardAddress}>{point.address}</p>
            </div>
            <blockquote className={s.cardQuote}>
              {point.hook.split(" / ").map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </blockquote>
          </div>
        </div>
      </div>
      <div className={s.cardActions}>
        <Link className={s.cardExplore} href={pointHref(lang, point)}>
          <span>{ui.viewDetails}</span>
          <span className={s.cardArrow} aria-hidden="true" />
        </Link>
        <span className={s.cardBadge} aria-hidden="true">
          {point.code.toUpperCase()}
        </span>
        <button type="button" className={s.cardDirections} onClick={onRoute}>
          <span>{ui.directionsTo}</span>
          <span className={s.cardArrow} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
