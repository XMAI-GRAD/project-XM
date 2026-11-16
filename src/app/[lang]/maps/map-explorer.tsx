"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { matchesMapSearch } from "@/features/maps/search";
import {
  findSavedRoute,
  type SavedMapRoute,
  type MapContextLabel,
} from "@/features/maps/catalogue";
import { DirectionsPanel } from "./directions-panel";
import type { MapControls, MapViewport } from "./map-canvas";
import s from "./page.module.css";

const MapCanvas = dynamic(() => import("./map-canvas"), { ssr: false });
const noPoints: MapGroup["points"] = [];
function subscribeDestination(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("map-route-change", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("map-route-change", onChange);
  };
}
const readDestination = () => window.location.search;
function writeRouteSelection(from: string, to: string, open: boolean) {
  const url = new URL(window.location.href);
  for (const key of ["from", "to", "view"]) url.searchParams.delete(key);
  if (open) {
    url.searchParams.set("view", "routes");
    if (from) url.searchParams.set("from", from);
    if (to) url.searchParams.set("to", to);
  }
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + url.search + url.hash,
  );
  window.dispatchEvent(new Event("map-route-change"));
}
export type DisplayMapLabel = Omit<MapContextLabel, "name"> & { name: string };

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
  routes: SavedMapRoute[];
  contextLabels: DisplayMapLabel[];
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
  routes,
  contextLabels,
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
  const routeQuery = useSyncExternalStore(
    subscribeDestination,
    readDestination,
    () => "",
  );
  const parameters = new URLSearchParams(routeQuery);
  const validSlug = (key: string) => {
    const slug = parameters.get(key) ?? "";
    return groups.some((group) =>
      group.points.some((point) => point.slug === slug),
    )
      ? slug
      : "";
  };
  const fromSlug = validSlug("from"),
    toSlug = validSlug("to");
  const directionsOpen =
    parameters.get("view") === "routes" || Boolean(fromSlug || toSlug);
  const [routeFitKey, setRouteFitKey] = useState(0);
  const [showNames, setShowNames] = useState(true);
  const fromInput = useRef<HTMLSelectElement>(null);
  const modeButton = useRef<HTMLButtonElement>(null);
  const route = directionsOpen
    ? findSavedRoute(routes, fromSlug, toSlug)
    : undefined;
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
  const featured = directionsOpen
    ? undefined
    : points.find((point) => point.slug === selectedSlug);
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

  function changeRoute(from: string, to: string) {
    writeRouteSelection(from, to, true);
    setSelectedSlug(null);
    setRouteFitKey((key) => key + 1);
  }

  function changeMode(directions: boolean) {
    setSelectedSlug(null);
    writeRouteSelection(
      directions ? fromSlug : "",
      directions ? toSlug : "",
      directions,
    );
    setRouteFitKey((key) => key + 1);
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
        } else if (event.key === "Escape" && directionsOpen) {
          event.preventDefault();
          changeMode(false);
          modeButton.current?.focus();
        }
      }}
    >
      <aside className={s.sidebar} aria-label={ui.places}>
        <div className={s.modeButtons} role="group" aria-label={ui.mapMode}>
          <button
            type="button"
            aria-pressed={!directionsOpen}
            onClick={() => changeMode(false)}
          >
            {ui.browse}
          </button>
          <button
            ref={modeButton}
            type="button"
            aria-pressed={directionsOpen}
            onClick={() => changeMode(true)}
          >
            {ui.directions}
          </button>
        </div>
        {directionsOpen ? (
          <DirectionsPanel
            id={instanceId}
            lang={lang}
            groups={groups}
            routes={routes}
            from={fromSlug}
            to={toSlug}
            route={route}
            ready={viewport.ready}
            fromRef={fromInput}
            onChange={changeRoute}
            onFit={() => mapControls.current?.fitRoute()}
            ui={ui}
          />
        ) : (
          <>
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
              <div
                className={s.layerButtons}
                role="group"
                aria-label={ui.layers}
              >
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
            <div
              ref={listRef}
              id={locationsId}
              className={s.locations}
              key={layer}
            >
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
                          data-featured={
                            point.slug === featured?.slug || undefined
                          }
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
          </>
        )}
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
          <label className={s.namesToggle} title={ui.contextHint}>
            <input
              type="checkbox"
              checked={showNames}
              onChange={(e) => setShowNames(e.target.checked)}
            />
            {ui.showNames}
          </label>
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
              points={directionsOpen ? noPoints : points}
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
              contextLabels={contextLabels}
              showNames={showNames}
              route={route}
              routeFitKey={routeFitKey}
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
              <button
                type="button"
                className={s.routeToPlace}
                onClick={() => {
                  changeRoute("", featured.slug);
                  requestAnimationFrame(() => fromInput.current?.focus());
                }}
              >
                {ui.directionsTo} <Icon name="arrow" />
              </button>
            </article>
          )}
        </div>

        <div className={s.canvasFooter}>
          <div>
            {directionsOpen ? (
              <p className={s.directionLegend}>
                {route ? (
                  <>
                    <span className={s.endpointBadge}>A</span> →{" "}
                    <span className={s.endpointBadge}>B</span> {ui.walking}
                  </>
                ) : (
                  ui.approximatePositions
                )}
              </p>
            ) : (
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
            )}
            <p className={s.gestureHint}>{ui.gestureHint}</p>
            {showNames && <p className={s.gestureHint}>{ui.contextHint}</p>}
          </div>
          <div className={s.controls} role="group" aria-label={ui.controls}>
            {(
              [
                [-80, 0, "panLeft", "←"],
                [80, 0, "panRight", "→"],
                [0, -80, "panUp", "↑"],
                [0, 80, "panDown", "↓"],
              ] as const
            ).map(([x, y, label, arrow]) => (
              <button
                key={label}
                type="button"
                disabled={!viewport.ready}
                onClick={() => mapControls.current?.pan(x, y)}
                aria-label={ui[label]}
                title={ui[label]}
              >
                {arrow}
              </button>
            ))}
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
        <div className={s.attribution}>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            {ui.referenceData}
          </a>{" "}
          ·{" "}
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
            OpenFreeMap
          </a>{" "}
          /{" "}
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            OpenMapTiles
          </a>{" "}
          ·{" "}
          <a
            href="https://routing.openstreetmap.de/about.html"
            target="_blank"
            rel="noreferrer"
          >
            OSRM / FOSSGIS
          </a>{" "}
          ·{" "}
          <a
            href="https://www.openstreetmap.org/fixthemap"
            target="_blank"
            rel="noreferrer"
          >
            {ui.fixMap}
          </a>
        </div>
      </section>
    </div>
  );
}
