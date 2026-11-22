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
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import type { Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { matchesMapSearch } from "../search";
import { SearchIcon } from "@/components/search-icon";
import { SearchFrame } from "@/features/home/art";
import type { DesignMapGroup, DesignMapOrigin, DesignMapPoint } from "./types";
import type { DesignMapControls, DesignMapViewport } from "./map-canvas";
import { LocationCard, type LocationCardControls } from "./location-card";
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
function writeSelection(slug: string | null, view?: "route") {
  const url = new URL(window.location.href);
  for (const key of ["from", "to", "view"]) url.searchParams.delete(key);
  if (slug) url.searchParams.set("to", slug);
  if (slug && view) url.searchParams.set("view", view);
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + url.search + url.hash,
  );
  window.dispatchEvent(new Event("map-destination-change"));
}

/* Reuses the existing map controls' vector icons. */
type ControlIconName = "plus" | "minus" | "reset" | "close";

function ControlIcon({ name }: { name: ControlIconName }) {
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

function MapToolButton({
  icon,
  label,
  disabled = false,
  onClick,
}: {
  icon: ControlIconName;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const labelOpen = (hovered || focused) && !dismissed;

  useEffect(() => {
    if (!labelOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setDismissed(true);
    };
    document.addEventListener("keydown", dismiss, true);
    return () => document.removeEventListener("keydown", dismiss, true);
  }, [labelOpen]);

  return (
    <span
      className={s.tool}
      data-label-open={labelOpen}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        setHovered(true);
        setDismissed(false);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => {
        setFocused(event.target.matches(":focus-visible"));
        setDismissed(false);
      }}
      onBlur={() => setFocused(false)}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={() => {
          setDismissed(true);
          onClick();
        }}
      >
        <ControlIcon name={icon} />
      </button>
      <span className={s.toolLabel} aria-hidden="true">
        {label}
      </span>
    </span>
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
  origin: DesignMapOrigin;
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
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [viewport, setViewport] = useState<DesignMapViewport>({
    ready: false,
    canZoomIn: false,
    canZoomOut: false,
  });
  const controls = useRef<DesignMapControls>(null);
  const root = useRef<HTMLElement>(null);
  const card = useRef<LocationCardControls>(null);
  const search = useRef<HTMLInputElement>(null);
  const cardTitle = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const legendTrigger = useRef<HTMLButtonElement>(null);
  const params = useSyncExternalStore(subscribe, snapshot, () => "");
  const selectionParams = new URLSearchParams(params);
  const destination = selectionParams.get("to");
  const allPoints = useMemo(
    () => groups.flatMap((group) => group.points),
    [groups],
  );
  const selected = allPoints.find((point) => point.slug === destination);
  const routeVisible = !!selected && selectionParams.get("view") === "route";
  const activeLayer = selected?.layer ?? layer;
  const group = groups.find((entry) => entry.layer === activeLayer)!;
  const visible = useMemo(
    () => group.points.filter((point) => matchesMapSearch(point, query)),
    [group, query],
  );
  const highlight = useCallback((slug: string | null) => {
    // Scrolling a focused pin into view can move the pointer out of a row.
    // Keep keyboard focus linked even when that pointer-leave arrives later.
    const focused = document.activeElement as HTMLElement | null;
    setHighlighted(slug ?? focused?.dataset.point ?? null);
  }, []);
  const select = useCallback((point: DesignMapPoint, source: HTMLElement) => {
    card.current?.cancelDismiss();
    trigger.current = source;
    setQuery("");
    setLayer(point.layer);
    writeSelection(point.slug);
  }, []);
  const onError = useCallback(() => {
    setError(true);
    setViewport({ ready: false, canZoomIn: false, canZoomOut: false });
  }, []);
  const previousLayer = useRef(activeLayer);
  useGSAP(
    () => {
      const previous = previousLayer.current;
      previousLayer.current = activeLayer;
      const changed = previous !== activeLayer;
      const media = gsap.matchMedia();
      media.add(
        MOTION,
        () => {
          if (changed) {
            const oldDecoration = root.current?.querySelector(
              `.${s.sidebarDecoration}[data-layer="${previous}"]`,
            );
            const decoration = root.current?.querySelector(
              `.${s.sidebarDecoration}[data-layer="${activeLayer}"]`,
            );
            gsap.fromTo(
              oldDecoration ?? [],
              { opacity: 1 },
              { opacity: 0, duration: 0.2 },
            );
            gsap.fromTo(
              decoration ?? [],
              { opacity: 0 },
              { opacity: 1, duration: 0.35 },
            );
            if (decoration)
              gsap.from(decoration.children, {
                y: (i) => (i === 0 ? -10 : 10),
                duration: 0.4,
                ease: "power3.out",
              });
            gsap.from(
              `.${s.resultSummary}, .${s.layerTitle}, .${s.layerIntro}`,
              { opacity: 0, y: 4, duration: 0.25, stagger: 0.025 },
            );
          }
          gsap.from(`.${s.listScroll} li, .${s.empty}`, {
            opacity: 0,
            y: changed ? 8 : 3,
            duration: changed ? 0.28 : 0.16,
            stagger: changed ? 0.025 : 0.01,
            clearProps: "opacity,transform",
            ease: "power2.out",
          });
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root, dependencies: [activeLayer, query], revertOnUpdate: true },
  );

  const previousHighlight = useRef<string | null>(null);
  useGSAP(
    () => {
      const previous = previousHighlight.current;
      previousHighlight.current = highlighted;
      const media = gsap.matchMedia();
      media.add(
        MOTION,
        () => {
          for (const row of list.current?.querySelectorAll<HTMLButtonElement>(
            "button[data-point]",
          ) ?? []) {
            const active = row.dataset.point === highlighted;
            if (active || row.dataset.point === previous)
              gsap.fromTo(
                row.querySelector(`.${s.rowArrow}`),
                { x: active ? 0 : 4 },
                { x: active ? 4 : 0, duration: 0.17, ease: "power2.out" },
              );
          }
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root, dependencies: [highlighted], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      if (!legendOpen) return;
      const media = gsap.matchMedia();
      media.add(
        MOTION,
        () => {
          gsap.from(`.${s.legendPopover}`, {
            opacity: 0,
            y: 10,
            scale: 0.96,
            transformOrigin: "right bottom",
            duration: 0.22,
            ease: "power2.out",
          });
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root, dependencies: [legendOpen], revertOnUpdate: true },
  );

  function close() {
    if (card.current) card.current.dismiss(finishClose);
    else finishClose();
  }

  function showRoute() {
    if (!selected) return;
    const slug = selected.slug;
    card.current?.dismiss(() => {
      setHighlighted(null);
      writeSelection(slug, "route");
      requestAnimationFrame(() => {
        const current = new URLSearchParams(window.location.search);
        if (current.get("to") !== slug || current.get("view") !== "route")
          return;
        const map = root.current?.querySelector<HTMLElement>(
          `.${s.mapSurface}`,
        );
        map?.focus({ preventScroll: true });
        map?.scrollIntoView({ block: "nearest", behavior: "instant" });
      });
    });
  }

  function finishClose() {
    if (selected) setLayer(selected.layer);
    writeSelection(null);
    requestAnimationFrame(() => {
      if (new URLSearchParams(window.location.search).get("to")) return;
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
      ref={root}
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
        {groups.map((entry) => (
          <div
            key={entry.layer}
            className={s.sidebarDecoration}
            data-layer={entry.layer}
            data-active={activeLayer === entry.layer}
            aria-hidden="true"
          >
            {["top", "bottom"].map((part) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={part}
                data-part={part}
                src={
                  entry.layer === "place"
                    ? "/maps/v2/sidebar-decoration.svg"
                    : `/maps/v2/pin-${entry.layer}.svg`
                }
                alt=""
              />
            ))}
          </div>
        ))}
        <div className={s.sidebarHead}>
          <h2>{ui.design.title}</h2>
          <div className={s.searchBox}>
            <SearchFrame className={s.searchFrame} />
            <SearchIcon className={s.searchIcon} />
            <label className="sr-only" htmlFor={searchId}>
              {ui.search}
            </label>
            <input
              id={searchId}
              ref={search}
              type="search"
              value={query}
              placeholder={ui.search}
              aria-describedby={hintId}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setHighlighted(null);
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
                  setHighlighted(null);
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
                  setHighlighted(null);
                  setLayer(entry.layer);
                  setQuery("");
                  writeSelection(null);
                  if (list.current) list.current.scrollTop = 0;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    activeLayer === entry.layer
                      ? `/maps/v2/pin-${entry.layer}.svg`
                      : `/maps/v2/tab-${entry.layer}-symbol.svg`
                  }
                  alt=""
                />
                <span>{entry.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={s.results} data-layer={activeLayer}>
          {!selected && <div id={cardId} className="sr-only" />}
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
                      data-highlighted={highlighted === point.slug}
                      onPointerEnter={() => highlight(point.slug)}
                      onPointerLeave={(event) => {
                        if (!event.currentTarget.matches(":focus"))
                          highlight(null);
                      }}
                      onFocus={() => highlight(point.slug)}
                      onBlur={(event) => {
                        if (!event.currentTarget.matches(":hover"))
                          highlight(null);
                      }}
                      aria-pressed={selected?.slug === point.slug}
                      onClick={(event) => select(point, event.currentTarget)}
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
        </div>
      </aside>
      <div className={s.canvas}>
        {!error && (
          <Canvas
            key={attempt}
            ref={controls}
            artwork={artwork}
            origin={origin}
            points={visible}
            selected={selected?.slug ?? null}
            routeVisible={routeVisible}
            highlighted={highlighted}
            onHighlight={highlight}
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
        {selected && !routeVisible && (
          <LocationCard
            ref={card}
            point={selected}
            layerName={group.name}
            lang={lang}
            id={cardId}
            titleId={titleId}
            titleRef={cardTitle}
            onClose={close}
            onRoute={showRoute}
            ui={ui}
          />
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/maps/v2/legend.svg" alt={ui.design.legend} />
          </div>
        )}
      </div>
      <div className={s.tools} role="group" aria-label={ui.controls}>
        {routeVisible && (
          <MapToolButton icon="close" label={ui.clearRoute} onClick={close} />
        )}
        <MapToolButton
          icon="plus"
          label={ui.zoomIn}
          disabled={!viewport.ready || !viewport.canZoomIn}
          onClick={() => controls.current?.zoom(0.5)}
        />
        <MapToolButton
          icon="minus"
          label={ui.zoomOut}
          disabled={!viewport.ready || !viewport.canZoomOut}
          onClick={() => controls.current?.zoom(-0.5)}
        />
        <MapToolButton
          icon="reset"
          label={ui.resetView}
          disabled={!viewport.ready}
          onClick={() => controls.current?.reset()}
        />
      </div>
      <p id={helpId} className="sr-only">
        {ui.keyboardHelp}
      </p>
    </section>
  );
}
