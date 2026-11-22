"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type Ref } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { DesignMapPoint } from "./types";
import s from "./map.module.css";

/** The selected-place card from web final-18.svg, with live content and links. */
export function LocationCard({
  point,
  layerName,
  lang,
  id,
  titleId,
  titleRef,
  origin,
  onClose,
  ui,
}: {
  point: DesignMapPoint;
  layerName: string;
  lang: Locale;
  id: string;
  titleId: string;
  titleRef: Ref<HTMLHeadingElement>;
  origin: string;
  onClose: () => void;
  ui: Dictionary["maps"];
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article
      id={id}
      aria-labelledby={titleId}
      className={s.locationCard}
      data-layer={point.layer}
      data-code={point.code}
      lang={lang}
    >
      <p className={s.cardMeta}>
        <span>
          {point.code.toUpperCase()} / {layerName}
        </span>
        <span>{ui.selectedPlace}</span>
      </p>
      <button
        type="button"
        className={s.cardClose}
        aria-label={ui.closeCard}
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/maps/v2/card-close.svg" alt="" />
      </button>
      <div className={s.cardPhoto}>
        {point.photo && !imageFailed ? (
          <Image
            src={point.photo.src}
            alt={point.photo.alt}
            fill
            loading="eager"
            sizes="(max-width: 800px) 310px, 16vw"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={s.cardPhotoUnavailable}>{ui.imageUnavailable}</span>
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
        <h3 id={titleId} ref={titleRef} tabIndex={-1} aria-label={point.name}>
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
      <Link className={s.cardExplore} href={`/${lang}/explore/${point.slug}`}>
        <span>{ui.viewDetails}</span>
        <span className={s.cardArrow} aria-hidden="true" />
      </Link>
      <span className={s.cardBadge} aria-hidden="true">
        {point.code.toUpperCase()}
      </span>
      <a
        className={s.cardDirections}
        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(point.directionsDestination)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>{ui.directionsTo}</span>
        <span className={s.cardArrow} aria-hidden="true" />
      </a>
    </article>
  );
}
