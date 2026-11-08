"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
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
    mapNote?: string;
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
  locate: "M12 2v4m0 12v4M2 12h4m12 0h4M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0",
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

function PlaceCover({
  cover,
  code,
  name,
  unavailable,
}: {
  cover?: MapImage;
  code: string;
  name: string;
  unavailable: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={s.coverFrame}>
      {cover && !failed && (
        <Image
          className={s.cover}
          data-loaded={loaded || undefined}
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          sizes="(max-width: 900px) 90vw, 300px"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      <span className={s.coverCode} aria-hidden="true">
        {code}
      </span>
      <span className={s.coverLayer}>{name}</span>
      <span className={s.coverCorner} aria-hidden="true" />
      {failed && (
        <span className="sr-only" role="status">
          {unavailable}
        </span>
      )}
    </div>
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
  // Cached localized routes remain mounted, so every instance needs its own IDs.
  const instanceId = useId();
  const searchId = `${instanceId}-search`;
  const searchHintId = `${instanceId}-search-hint`;
  const locationsId = `${instanceId}-locations`;
  const canvasId = `${instanceId}-canvas`;
  const cardId = `${instanceId}-place-card`;
  const cardTitleId = `${instanceId}-place-name`;
  const keyboardHelpId = `${instanceId}-keyboard-help`;
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
  const cardRef = useRef<HTMLElement>(null);
  const cardScroll = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listButtons = useRef(new Map<string, HTMLButtonElement>());
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
  const selectPlace = useCallback((slug: string, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setSelectedSlug(slug);
    setSelectionKey((value) => value + 1);
  }, []);
  const reportMapError = useCallback(() => {
    setMapError(true);
    setViewport({ ready: false, canZoomIn: false, canZoomOut: false });
  }, []);
  useEffect(() => {
    if (!selectedSlug) return;
    cardScroll.current?.scrollTo({ top: 0, behavior: "instant" });
    cardTitle.current?.focus({ preventScroll: true });
    cardRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    const list = listRef.current;
    const item = listButtons.current.get(selectedSlug);
    if (list && item) {
      const listBox = list.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();
      if (itemBox.top < listBox.top)
        list.scrollTop += itemBox.top - listBox.top;
      else if (itemBox.bottom > listBox.bottom)
        list.scrollTop += itemBox.bottom - listBox.bottom;
    }
  }, [selectedSlug, selectionKey]);

  function closeCard() {
    setSelectedSlug(null);
    if (lastTrigger.current?.isConnected) lastTrigger.current.focus();
    else searchInput.current?.focus({ preventScroll: true });
  }

  function changeSearch(value: string) {
    setQuery(value);
    if (featured && !matchesMapSearch(featured, value)) setSelectedSlug(null);
  }

  function clearSearch() {
    changeSearch("");
    searchInput.current?.focus({ preventScroll: true });
  }

  if (!activeGroup) return null;
  const { layer, name, intro } = activeGroup;

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
            <label className="sr-only" htmlFor={searchId}>
              {ui.search}
            </label>
            <input
              ref={searchInput}
              id={searchId}
              type="search"
              placeholder={ui.searchPlaceholder}
              value={query}
              onChange={(event) => changeSearch(event.target.value)}
              aria-controls={locationsId}
              aria-describedby={searchHintId}
            />
            {query && (
              <button
                className={s.clearSearch}
                type="button"
                onClick={clearSearch}
                aria-label={ui.clearSearch}
              >
                <Icon name="close" />
              </button>
            )}
          </div>
          <p id={searchHintId} className={s.searchHint}>
            {ui.searchHint}
          </p>
          <div className={s.layerButtons} role="group" aria-label={ui.layers}>
            {groups.map((group) => (
              <button
                key={group.layer}
                type="button"
                data-layer={group.layer}
                aria-pressed={group.layer === layer}
                aria-controls={`${locationsId} ${canvasId}`}
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
        <div ref={listRef} id={locationsId} className={s.locations} key={layer}>
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
                      ref={(element) => {
                        if (element)
                          listButtons.current.set(point.slug, element);
                        else listButtons.current.delete(point.slug);
                      }}
                      type="button"
                      className={s.location}
                      data-featured={point.slug === featured?.slug || undefined}
                      aria-pressed={point.slug === featured?.slug}
                      aria-controls={cardId}
                      onClick={(event) =>
                        selectPlace(point.slug, event.currentTarget)
                      }
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
              <div className={s.empty}>
                <p>{query.trim() ? ui.noResults : emptyLabel}</p>
                {query.trim() && (
                  <button
                    type="button"
                    className={s.textAction}
                    onClick={clearSearch}
                  >
                    {ui.clearSearch}
                  </button>
                )}
              </div>
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
        id={canvasId}
        className={s.canvas}
        data-layer={layer}
        aria-label={ui.canvas}
      >
        <div className={s.canvasHeader}>
          <p className={s.canvasTitle}>
            <span className={s.registrationMark} aria-hidden="true" />
            {ui.canvas}
          </p>
          <span className={s.preview}>{ui.approximatePositions}</span>
        </div>
        <div className={s.mapContent}>
          <div
            className={s.mapViewport}
            aria-busy={!viewport.ready && !mapError}
          >
            <MapCanvas
              key={mapAttempt}
              ref={mapControls}
              artwork={artwork}
              points={points}
              layer={layer}
              selectedSlug={featured?.slug ?? null}
              selectionKey={selectionKey}
              cardRef={cardRef}
              cardId={cardId}
              keyboardHelpId={keyboardHelpId}
              onSelect={selectPlace}
              onViewport={setViewport}
              onError={reportMapError}
              ui={ui}
            />
            <p id={keyboardHelpId} className="sr-only">
              {ui.keyboardHelp}
            </p>
            {!viewport.ready && (
              <div className={s.mapStatus} role="status">
                <p>{mapError ? ui.loadError : ui.loading}</p>
                {mapError && (
                  <button
                    type="button"
                    className={s.textAction}
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
          </div>

          {featured && (
            <article
              id={cardId}
              ref={cardRef}
              className={s.placeCard}
              data-layer={layer}
              key={featured.slug}
              aria-labelledby={cardTitleId}
            >
              <div className={s.cardToolbar}>
                <p className={`meta ${s.cardMeta}`}>
                  <span>
                    {featured.code} / {name}
                  </span>
                  <span>{ui.selectedPlace}</span>
                </p>
                <button
                  className={s.closeCard}
                  type="button"
                  onClick={closeCard}
                  aria-label={ui.closeCard}
                >
                  <Icon name="close" />
                </button>
              </div>
              <div className={s.cardScroll} ref={cardScroll}>
                <PlaceCover
                  cover={featured.cover}
                  code={featured.code}
                  name={name}
                  unavailable={ui.imageUnavailable}
                />
                <div className={s.cardBody}>
                  <h2 id={cardTitleId} ref={cardTitle} tabIndex={-1}>
                    {featured.name}
                  </h2>
                  <p className={s.address}>{featured.address}</p>
                  {featured.mapNote && (
                    <p className={s.mapNote}>{featured.mapNote}</p>
                  )}
                  {!featured.mapPosition && (
                    <p className={s.address}>{ui.positionUnavailable}</p>
                  )}
                  <p className={s.hook}>{featured.hook}</p>
                </div>
              </div>
              <div className={s.cardActions}>
                <Link
                  className={s.detailLink}
                  href={`/${lang}/explore/${featured.slug}`}
                >
                  {ui.viewDetails}
                  <Icon name="arrow" />
                </Link>
                {featured.mapPosition && (
                  <button
                    type="button"
                    className={s.locatePlace}
                    disabled={!viewport.ready}
                    onClick={() => mapControls.current?.locate()}
                    aria-label={ui.showOnMap}
                    title={ui.showOnMap}
                  >
                    <Icon name="locate" />
                  </button>
                )}
              </div>
            </article>
          )}
        </div>

        <div className={s.canvasFooter}>
          <div>
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
            <p className={s.gestureHint}>{ui.gestureHint}</p>
          </div>
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
              onClick={() => {
                setSelectedSlug(null);
                mapControls.current?.reset();
              }}
              aria-label={ui.resetView}
              title={ui.resetView}
            >
              <Icon name="reset" />
            </button>
          </div>
        </div>
        <a
          className={s.attribution}
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          {ui.referenceData}
        </a>
      </section>
    </div>
  );
}
