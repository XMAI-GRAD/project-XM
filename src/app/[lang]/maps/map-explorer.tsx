"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import s from "./page.module.css";

interface MapImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface MapGroup {
  layer: Layer;
  name: string;
  intro: string;
  points: {
    slug: string;
    code: string;
    name: string;
    address: string;
    hook: string;
    cover?: MapImage;
  }[];
}

interface MapExplorerProps {
  lang: Locale;
  groups: MapGroup[];
  artwork: MapImage;
  brand: string;
  ui: Dictionary["maps"];
  emptyLabel: string;
}

const iconPaths = {
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  reset: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8",
};

function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={iconPaths[name]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MapExplorer({
  lang,
  groups,
  artwork,
  brand,
  ui,
  emptyLabel,
}: MapExplorerProps) {
  const [activeLayer, setActiveLayer] = useState<Layer>(
    groups[0]?.layer ?? "place",
  );
  const activeGroup =
    groups.find((group) => group.layer === activeLayer) ?? groups[0];
  if (!activeGroup) return null;
  const { points, layer, name, intro } = activeGroup;
  const featured = points[0];
  const cover = featured?.cover;

  return (
    <div className={s.workspace}>
      <aside className={s.sidebar} aria-label={ui.places}>
        <div className={s.sidebarHeader}>
          <p className={`meta ${s.sidebarLabel}`}>{ui.layers}</p>
          <label className={s.search}>
            <Icon name="search" />
            <span className="sr-only">{ui.search}</span>
            <input type="search" placeholder={ui.searchPlaceholder} disabled />
          </label>
          <div className={s.layerButtons} role="group" aria-label={ui.layers}>
            {groups.map((group) => (
              <button
                key={group.layer}
                type="button"
                data-layer={group.layer}
                aria-pressed={group.layer === layer}
                aria-controls="map-locations map-canvas"
                onClick={() => setActiveLayer(group.layer)}
              >
                <span className={s.layerSymbol} aria-hidden="true" />
                {group.name}
              </button>
            ))}
          </div>
        </div>

        <div
          className={s.listHeading}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <h2 className="meta">
            {ui.places}
            <span className="sr-only"> · {name}</span>
          </h2>
          <span className={s.count}>
            {String(points.length).padStart(2, "0")}
          </span>
        </div>
        <div id="map-locations" className={s.locations} key={layer}>
          <section className={s.group} data-layer={layer}>
            <div className={s.groupHeading}>
              <div className={s.groupLabel}>
                <h3>
                  <span className={s.layerDot} aria-hidden="true" />
                  {name}
                </h3>
                <span className={s.groupCount}>
                  {String(points.length).padStart(2, "0")}
                </span>
              </div>
              <p>{intro}</p>
            </div>
            {points.length ? (
              <ul>
                {points.map((point) => (
                  <li key={point.slug}>
                    <Link
                      href={`/${lang}/explore/${point.slug}`}
                      className={s.location}
                      data-featured={point.slug === featured?.slug || undefined}
                    >
                      <span className={s.pointCode}>{point.code}</span>
                      <span className={s.locationText}>
                        <strong>{point.name}</strong>
                        <span>{point.address}</span>
                      </span>
                      <Icon name="arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.empty}>{emptyLabel}</p>
            )}
          </section>
        </div>
        <div className={s.sidebarFooter}>
          <span className={s.connectionMark} aria-hidden="true">
            {groups.map((group) => (
              <i key={group.layer} data-layer={group.layer} />
            ))}
          </span>
          <span className="meta">{brand}</span>
        </div>
      </aside>

      <section
        id="map-canvas"
        className={s.canvas}
        data-layer={layer}
        aria-label={ui.canvas}
      >
        <Image
          className={s.artwork}
          src={artwork.src}
          alt={artwork.alt}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1400px) calc(100vw - 448px), calc(100vw - 488px)"
        />
        <div className={s.canvasHeader}>
          <p className={s.canvasTitle}>
            <span className={s.registrationMark} aria-hidden="true" />
            {ui.canvas}
          </p>
          <span className={s.preview}>{ui.preview}</span>
        </div>

        {featured && (
          <article
            className={s.placeCard}
            data-layer={layer}
            key={featured.slug}
            aria-labelledby="map-place-name"
          >
            {cover && (
              <div className={s.coverFrame}>
                <Image
                  className={s.cover}
                  src={cover.src}
                  alt={cover.alt}
                  width={cover.width}
                  height={cover.height}
                  sizes="300px"
                />
                <span className={s.coverCode} aria-hidden="true">
                  {featured.code}
                </span>
                <span className={s.coverLayer}>{name}</span>
                <span className={s.coverCorner} aria-hidden="true" />
              </div>
            )}
            <div className={s.cardBody}>
              <p className={`meta ${s.cardMeta}`}>
                <span>
                  {featured.code} / {name}
                </span>
                <span>{ui.sampleCard}</span>
              </p>
              <h2 id="map-place-name">{featured.name}</h2>
              <p className={s.address}>{featured.address}</p>
              <p className={s.hook}>{featured.hook}</p>
              <Link
                className={s.detailLink}
                href={`/${lang}/explore/${featured.slug}`}
              >
                {ui.viewDetails}
                <Icon name="arrow" />
              </Link>
            </div>
          </article>
        )}

        <div className={s.canvasFooter}>
          <ul className={s.legend} aria-label={ui.layers}>
            {groups.map((group) => (
              <li key={group.layer} data-layer={group.layer}>
                <span className={s.legendPin} aria-hidden="true">
                  <i />
                </span>
                <span>{group.name}</span>
              </li>
            ))}
          </ul>
          <div className={s.controls} role="group" aria-label={ui.controls}>
            <button
              type="button"
              disabled
              aria-label={ui.zoomIn}
              title={ui.zoomIn}
            >
              <Icon name="plus" />
            </button>
            <button
              type="button"
              disabled
              aria-label={ui.zoomOut}
              title={ui.zoomOut}
            >
              <Icon name="minus" />
            </button>
            <button
              type="button"
              disabled
              aria-label={ui.resetView}
              title={ui.resetView}
            >
              <Icon name="reset" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
