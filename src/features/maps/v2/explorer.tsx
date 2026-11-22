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
import Link from "next/link";
import type { Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { matchesMapSearch } from "../search";
import type { DesignMapGroup, DesignMapPoint } from "./types";
import type { DesignMapControls, DesignMapViewport } from "./map-canvas";
import s from "./map.module.css";

const Canvas = dynamic(() => import("./map-canvas"), { ssr: false });
function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("map-destination-change", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("map-destination-change", onChange);
  };
}
const snapshot = () => window.location.search;
function writeSelection(slug: string | null) {
  const url = new URL(window.location.href);
  for (const key of ["from", "to", "view"]) url.searchParams.delete(key);
  if (slug) url.searchParams.set("to", slug);
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + url.search + url.hash,
  );
  window.dispatchEvent(new Event("map-destination-change"));
}

/* Reuses the existing map controls' vector icons. */
function ControlIcon({ name }: { name: "plus" | "minus" | "reset" | "close" }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    reset: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8",
    close: "m6 6 12 12M6 18 18 6",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DesignMapExplorer({
  lang,
  groups,
  artwork,
  origin,
  ui,
}: {
  lang: Locale;
  groups: DesignMapGroup[];
  artwork: { src: string; width: number; height: number };
  origin: string;
  ui: Dictionary["maps"];
}) {
  const id = useId();
  const searchId = `${id}-search`,
    hintId = `${id}-hint`,
    cardId = `${id}-card`,
    titleId = `${id}-title`,
    helpId = `${id}-help`;
  const [layer, setLayer] = useState<Layer>("place");
  const [query, setQuery] = useState("");
  const [legendOpen, setLegendOpen] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [viewport, setViewport] = useState<DesignMapViewport>({
    ready: false,
    canZoomIn: false,
    canZoomOut: false,
  });
  const controls = useRef<DesignMapControls>(null);
  const search = useRef<HTMLInputElement>(null);
  const cardTitle = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const legendTrigger = useRef<HTMLButtonElement>(null);
  const params = useSyncExternalStore(subscribe, snapshot, () => "");
  const destination = new URLSearchParams(params).get("to");
  const allPoints = useMemo(
    () => groups.flatMap((group) => group.points),
    [groups],
  );
  const selected = allPoints.find((point) => point.slug === destination);
  const activeLayer = selected?.layer ?? layer;
  const group = groups.find((entry) => entry.layer === activeLayer)!;
  const visible = useMemo(
    () => group.points.filter((point) => matchesMapSearch(point, query)),
    [group, query],
  );
  const select = useCallback((point: DesignMapPoint, source: HTMLElement) => {
    trigger.current = source;
    setQuery("");
    setLayer(point.layer);
    writeSelection(point.slug);
  }, []);
  const onError = useCallback(() => {
    setError(true);
    setViewport({ ready: false, canZoomIn: false, canZoomOut: false });
  }, []);
  useEffect(() => {
    if (selected) cardTitle.current?.focus({ preventScroll: true });
  }, [selected]);

  function close() {
    if (selected) setLayer(selected.layer);
    writeSelection(null);
    requestAnimationFrame(() => {
      if (trigger.current?.isConnected)
        trigger.current.focus({ preventScroll: true });
      else {
        const row = Array.from(
          list.current?.querySelectorAll("button") ?? [],
        ).find(
          (button) => button.dataset.point === trigger.current?.dataset.point,
        );
        (row ?? search.current)?.focus({ preventScroll: true });
      }
    });
  }

  function closeLegend() {
    setLegendOpen(false);
    legendTrigger.current?.focus({ preventScroll: true });
  }

  return (
    <section
      className={s.explorer}
      aria-label={ui.design.title}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        if (legendOpen) closeLegend();
        else if (selected) close();
        else if (query) {
          setQuery("");
          search.current?.focus();
        }
      }}
    >
      {/* Source-extracted frames keep the Illustrator's shaped corners. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.explorerFrame}
        src="/maps/v2/explorer-frame.svg"
        alt=""
        aria-hidden="true"
      />
      <aside className={s.sidebar}>
        <div
          className={s.sidebarDecoration}
          data-layer={activeLayer}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              activeLayer === "place"
                ? "/maps/v2/sidebar-decoration.svg"
                : `/maps/v2/pin-${activeLayer}.svg`
            }
            alt=""
          />
        </div>
        <div className={s.sidebarHead}>
          <h2>{ui.design.title}</h2>
          <div className={s.searchBox}>
            <label className="sr-only" htmlFor={searchId}>
              {ui.search}
            </label>
            <input
              id={searchId}
              ref={search}
              value={query}
              aria-describedby={hintId}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                if (selected) {
                  setLayer(selected.layer);
                  writeSelection(null);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && visible[0]) {
                  event.preventDefault();
                  select(visible[0], event.currentTarget);
                }
              }}
            />
            {query && (
              <button
                className={s.clearSearch}
                type="button"
                aria-label={ui.design.clear}
                onClick={() => {
                  setQuery("");
                  search.current?.focus();
                }}
              >
                <ControlIcon name="close" />
              </button>
            )}
          </div>
          <p id={hintId} className={s.searchHint}>
            {ui.design.searchHint}
          </p>
          <div className={s.layers} role="group" aria-label={ui.layers}>
            {groups.map((entry) => (
              <button
                key={entry.layer}
                type="button"
                data-layer={entry.layer}
                aria-pressed={activeLayer === entry.layer}
                onClick={() => {
                  setLayer(entry.layer);
                  setQuery("");
                  writeSelection(null);
                  if (list.current) list.current.scrollTop = 0;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/maps/v2/pin-${entry.layer}.svg`} alt="" />
                <span>{entry.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={s.results} data-layer={activeLayer}>
          {selected ? (
            <article
              id={cardId}
              aria-labelledby={titleId}
              className={s.details}
            >
              <button className={s.back} type="button" onClick={close}>
                {ui.design.back}
              </button>
              <p className={s.selectedCode}>
                {selected.code.toUpperCase()} · {group.name}
              </p>
              <h3 id={titleId} ref={cardTitle} tabIndex={-1}>
                {selected.name}
              </h3>
              <p className={s.selectedAddress}>{selected.address}</p>
              <p className={s.hook}>{selected.hook}</p>
              <div className={s.origin}>
                <span>{ui.design.origin}</span>
                <strong>{origin}</strong>
              </div>
              <Link
                className={s.detailLink}
                href={`/${lang}/explore/${selected.slug}`}
              >
                {ui.viewDetails}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/maps/v2/row-arrow.svg" alt="" />
              </Link>
            </article>
          ) : (
            <>
              <div id={cardId} className="sr-only" />
              <div
                className={s.resultSummary}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span>{ui.design.list}</span>
                <strong>{String(visible.length).padStart(2, "0")}</strong>
              </div>
              <h3 className={s.layerTitle}>{group.name}</h3>
              <p className={s.layerIntro}>{group.intro}</p>
              <div className={s.listScroll} ref={list}>
                {visible.length ? (
                  <ul aria-label={ui.design.list}>
                    {visible.map((point) => (
                      <li key={point.slug}>
                        <button
                          type="button"
                          data-point={point.slug}
                          onClick={(event) =>
                            select(point, event.currentTarget)
                          }
                          aria-controls={cardId}
                        >
                          <span className={s.badge}>
                            {point.code.toUpperCase()}
                          </span>
                          <span className={s.rowCopy}>
                            <strong>{point.name}</strong>
                            <span>{point.address}</span>
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className={s.rowArrow}
                            src="/maps/v2/row-arrow.svg"
                            alt=""
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={s.empty}>
                    <p>{ui.design.empty}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        search.current?.focus();
                      }}
                    >
                      {ui.design.clear}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
      <div className={s.canvas}>
        {!error && (
          <Canvas
            key={attempt}
            ref={controls}
            artwork={artwork}
            points={visible}
            selected={selected?.slug ?? null}
            cardId={cardId}
            helpId={helpId}
            onSelect={select}
            onViewport={setViewport}
            onError={onError}
            ui={ui}
          />
        )}
        {!viewport.ready && !error && (
          <div className={s.loading} role="status">
            {ui.design.loading}
          </div>
        )}
        {error && (
          <div className={s.mapError} role="alert">
            <p>{ui.loadError}</p>
            <button
              type="button"
              onClick={() => {
                setError(false);
                setAttempt((value) => value + 1);
              }}
            >
              {ui.retry}
            </button>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={s.compass}
          src="/maps/v2/compass.svg"
          alt=""
          aria-hidden="true"
        />
        <button
          className={s.legend}
          ref={legendTrigger}
          type="button"
          aria-label={ui.design.legend}
          aria-expanded={legendOpen}
          aria-controls={legendOpen ? `${id}-legend` : undefined}
          onClick={() => setLegendOpen(!legendOpen)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maps/v2/legend.svg" alt="" />
        </button>
        {legendOpen && (
          <div
            id={`${id}-legend`}
            className={s.legendPopover}
            role="region"
            aria-label={ui.design.legend}
          >
            <button
              type="button"
              className={s.legendClose}
              aria-label={ui.design.close}
              onClick={closeLegend}
            >
              <ControlIcon name="close" />
            </button>
            <h3>{ui.design.legend}</h3>
            <p>{ui.design.legendDescription}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/maps/v2/legend.svg" alt="" />
          </div>
        )}
      </div>
      <div className={s.tools} role="group" aria-label={ui.controls}>
        <button
          type="button"
          disabled={!viewport.ready || !viewport.canZoomIn}
          aria-label={ui.zoomIn}
          title={ui.zoomIn}
          onClick={() => controls.current?.zoom(0.5)}
        >
          <ControlIcon name="plus" />
        </button>
        <button
          type="button"
          disabled={!viewport.ready || !viewport.canZoomOut}
          aria-label={ui.zoomOut}
          title={ui.zoomOut}
          onClick={() => controls.current?.zoom(-0.5)}
        >
          <ControlIcon name="minus" />
        </button>
        <button
          type="button"
          disabled={!viewport.ready}
          aria-label={ui.resetView}
          title={ui.resetView}
          onClick={() => controls.current?.reset()}
        >
          <ControlIcon name="reset" />
        </button>
      </div>
      <p id={helpId} className={s.help}>
        {ui.keyboardHelp}
      </p>
    </section>
  );
}
