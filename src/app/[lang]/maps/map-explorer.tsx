"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { matchesMapSearch } from "@/features/maps/search";
import type { MapControls, MapViewport } from "./map-canvas";
import s from "./page.module.css";

const MapCanvas = dynamic(() => import("./map-canvas"), { ssr: false });

export interface MapImage {
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
    mapPosition?: { x: number; y: number };
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
  close: "m6 6 12 12M6 18 18 6",
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
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectionKey, setSelectionKey] = useState(0);
  const [viewport, setViewport] = useState<MapViewport>({
    ready: false,
    canZoomIn: false,
    canZoomOut: false,
  });
  const [mapError, setMapError] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const mapControls = useRef<MapControls>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const cardTitle = useRef<HTMLHeadingElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const activeGroup =
    groups.find((group) => group.layer === activeLayer) ?? groups[0];
  const points = useMemo(
    () =>
      activeGroup?.points.filter((point) => matchesMapSearch(point, query)) ??
      [],
    [activeGroup, query],
  );
  const featured = points.find((point) => point.slug === selectedSlug);
  const selectPlace = useCallback((slug: string) => {
    lastTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedSlug(slug);
    setSelectionKey((value) => value + 1);
  }, []);
  const reportMapError = useCallback(() => {
    setMapError(true);
    setViewport({ ready: false, canZoomIn: false, canZoomOut: false });
  }, []);
  useEffect(() => {
    if (selectedSlug) cardTitle.current?.focus({ preventScroll: true });
  }, [selectedSlug, selectionKey]);

  function closeCard() {
    setSelectedSlug(null);
    if (lastTrigger.current?.isConnected)
      lastTrigger.current.focus({ preventScroll: true });
    else searchInput.current?.focus({ preventScroll: true });
  }

  function changeSearch(value: string) {
    setQuery(value);
    if (featured && !matchesMapSearch(featured, value)) setSelectedSlug(null);
  }

  if (!activeGroup) return null;
  const { layer, name, intro } = activeGroup;
  const cover = featured?.cover;

  return (
    <div
      className={s.workspace}
      onKeyDown={(event) => {
        if (event.key === "Escape" && featured) {
          event.preventDefault();
          event.stopPropagation();
          closeCard();
        }
      }}
    >
      <aside className={s.sidebar} aria-label={ui.places}>
        <div className={s.sidebarHeader}>
          <p className={`meta ${s.sidebarLabel}`}>{ui.layers}</p>
          <div className={s.search}>
            <Icon name="search" />
            <label className="sr-only" htmlFor="map-search">
              {ui.search}
            </label>
            <input
              ref={searchInput}
              id="map-search"
              type="search"
              placeholder={ui.searchPlaceholder}
              value={query}
              onChange={(event) => changeSearch(event.target.value)}
              aria-controls="map-locations"
              aria-describedby="map-search-hint"
            />
            {query && (
              <button
                className={s.clearSearch}
                type="button"
                onClick={() => {
                  changeSearch("");
                  searchInput.current?.focus();
                }}
                aria-label={ui.clearSearch}
              >
                <Icon name="close" />
              </button>
            )}
          </div>
          <p id="map-search-hint" className={s.searchHint}>
            {ui.searchHint}
          </p>
          <div className={s.layerButtons} role="group" aria-label={ui.layers}>
            {groups.map((group) => (
              <button
                key={group.layer}
                type="button"
                data-layer={group.layer}
                aria-pressed={group.layer === layer}
                aria-controls="map-locations map-canvas"
                onClick={() => {
                  if (group.layer !== layer) {
                    setActiveLayer(group.layer);
                    setSelectedSlug(null);
                  }
                }}
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
                    <button
                      type="button"
                      className={s.location}
                      data-featured={point.slug === featured?.slug || undefined}
                      aria-pressed={point.slug === featured?.slug}
                      aria-controls="map-place-card"
                      onClick={() => selectPlace(point.slug)}
                    >
                      <span className={s.pointCode}>{point.code}</span>
                      <span className={s.locationText}>
                        <strong>{point.name}</strong>
                        <span>{point.address}</span>
                      </span>
                      <Icon name="arrow" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.empty}>
                {query.trim() ? ui.noResults : emptyLabel}
              </p>
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
        <MapCanvas
          key={mapAttempt}
          ref={mapControls}
          artwork={artwork}
          points={points}
          layer={layer}
          selectedSlug={featured?.slug ?? null}
          selectionKey={selectionKey}
          onSelect={selectPlace}
          onViewport={setViewport}
          onError={reportMapError}
          ui={ui}
        />
        <p id="map-keyboard-help" className="sr-only">
          {ui.keyboardHelp}
        </p>
        {!viewport.ready && (
          <div className={s.mapStatus} role="status">
            <p>{mapError ? ui.loadError : ui.loading}</p>
            {mapError && (
              <button
                type="button"
                onClick={() => {
                  setMapError(false);
                  setMapAttempt((value) => value + 1);
                }}
              >
                {ui.retry}
              </button>
            )}
          </div>
        )}
        <div className={s.canvasHeader}>
          <p className={s.canvasTitle}>
            <span className={s.registrationMark} aria-hidden="true" />
            {ui.canvas}
          </p>
          <span className={s.preview}>{ui.approximatePositions}</span>
        </div>

        {featured && (
          <article
            id="map-place-card"
            className={s.placeCard}
            data-layer={layer}
            key={featured.slug}
            aria-labelledby="map-place-name"
          >
            <button
              className={s.closeCard}
              type="button"
              onClick={closeCard}
              aria-label={ui.closeCard}
            >
              <Icon name="close" />
            </button>
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
                <span>{ui.selectedPlace}</span>
              </p>
              <h2 id="map-place-name" ref={cardTitle} tabIndex={-1}>
                {featured.name}
              </h2>
              <p className={s.address}>{featured.address}</p>
              {!featured.mapPosition && (
                <p className={s.address}>{ui.positionUnavailable}</p>
              )}
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
              disabled={!viewport.ready || !viewport.canZoomIn}
              onClick={() => mapControls.current?.zoomIn()}
              aria-label={ui.zoomIn}
              title={ui.zoomIn}
            >
              <Icon name="plus" />
            </button>
            <button
              type="button"
              disabled={!viewport.ready || !viewport.canZoomOut}
              onClick={() => mapControls.current?.zoomOut()}
              aria-label={ui.zoomOut}
              title={ui.zoomOut}
            >
              <Icon name="minus" />
            </button>
            <button
              type="button"
              disabled={!viewport.ready}
              onClick={() => mapControls.current?.reset()}
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
