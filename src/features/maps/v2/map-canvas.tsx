"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import type { Dictionary } from "@/i18n/dictionaries";
import { mapFocusPoint } from "../layout";
import type { DesignMapPoint } from "./types";
import s from "./map.module.css";

export interface DesignMapControls {
  zoom: (delta: number) => void;
  reset: () => void;
}
export interface DesignMapViewport {
  ready: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
}
type MarkerEntry = {
  marker: L.Marker;
  button: HTMLButtonElement;
  visual: HTMLSpanElement;
  symbol: HTMLSpanElement;
  label: HTMLSpanElement;
  leaving: boolean;
};
type MapState = {
  points: DesignMapPoint[];
  selected: string | null;
  highlighted: string | null;
};

export default function DesignMapCanvas({
  ref,
  artwork,
  points,
  selected,
  highlighted,
  cardId,
  helpId,
  onSelect,
  onHighlight,
  onViewport,
  onError,
  ui,
}: {
  ref: Ref<DesignMapControls>;
  artwork: { src: string; width: number; height: number };
  points: DesignMapPoint[];
  selected: string | null;
  highlighted: string | null;
  cardId: string;
  helpId: string;
  onSelect: (point: DesignMapPoint, trigger: HTMLElement) => void;
  onHighlight: (slug: string | null) => void;
  onViewport: (value: DesignMapViewport) => void;
  onError: () => void;
  ui: Dictionary["maps"];
}) {
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const state = useRef<MapState>({ points, selected, highlighted });
  const callbacks = useRef({ onSelect, onHighlight });
  const actions = useRef<
    (DesignMapControls & { sync: () => void; stop: () => void }) | null
  >(null);
  useImperativeHandle(
    ref,
    () => ({
      zoom: (delta) => actions.current?.zoom(delta),
      reset: () => actions.current?.reset(),
    }),
    [],
  );

  useGSAP(
    () => {
      const host = element.current;
      if (!host) return;
      const bounds = L.latLngBounds([0, 0], [artwork.height, artwork.width]);
      const map = L.map(host, {
        crs: L.CRS.Simple,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0,
        zoomDelta: 0.5,
        minZoom: -5,
        maxZoom: 3,
        scrollWheelZoom: false,
        keyboard: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
        inertia: false,
        bounceAtZoomLimits: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1,
        trackResize: false,
      });
      mapRef.current = map;
      let ready = false;
      let disposed = false;
      const report = () =>
        onViewport({
          ready,
          canZoomIn: map.getZoom() < map.getMaxZoom() - 0.01,
          canZoomOut: map.getZoom() > map.getMinZoom() + 0.01,
        });
      const updateMinimum = () => {
        const size = map.getSize();
        if (size.x && size.y)
          map.setMinZoom(
            Math.log2(
              Math.max(size.x / artwork.width, size.y / artwork.height),
            ),
          );
      };
      const fit = () => {
        updateMinimum();
        map.setView(bounds.getCenter(), map.getMinZoom(), { animate: false });
      };
      fit();
      let constraining = false;
      const keepInsideBounds = () => {
        if (constraining) return;
        constraining = true;
        map.panInsideBounds(bounds, { animate: false });
        constraining = false;
      };
      // Clamp every frame, including camera tweens, keyboard pans, and touch pinches.
      map.on("move", keepInsideBounds);
      const overlay = L.imageOverlay(artwork.src, bounds, {
        alt: ui.design.illustration,
        interactive: false,
      });
      overlay.on("load", () => {
        if (!disposed) {
          ready = true;
          report();
        }
      });
      overlay.on("error", () => {
        if (!disposed) onError();
      });
      overlay.addTo(map);
      map.on("zoomend", report);

      let focusedPin: string | undefined;
      const media = gsap.matchMedia();
      media.add(
        { motion: MOTION, reduced: "(prefers-reduced-motion: reduce)" },
        (context) => {
          const motion = !!context.conditions?.motion;
          const entries = new Map<string, MarkerEntry>();
          let camera: gsap.core.Tween | undefined;
          let targetZoom: number | undefined;
          let lastPoints: DesignMapPoint[] | undefined;
          let lastSelected: string | null = null;
          let lastHighlighted: string | null = null;
          const positionLabels = () => {
            const size = map.getSize();
            const surface = host.getBoundingClientRect();
            const card = document
              .getElementById(cardId)
              ?.getBoundingClientRect();
            for (const entry of entries.values()) {
              if (!entry.label.offsetWidth) continue;
              const anchor = map.latLngToContainerPoint(
                entry.marker.getLatLng(),
              );
              const { offsetWidth: width, offsetHeight: height } = entry.label;
              const visible =
                anchor.x >= 0 &&
                anchor.x <= size.x &&
                anchor.y >= 0 &&
                anchor.y <= size.y;
              entry.label.style.visibility = visible ? "" : "hidden";
              if (!visible) continue;
              // Keep the name close to its icon, clear of map edges and the card.
              const naturalTop = anchor.y - 22 - height;
              const top = Math.max(
                8,
                Math.min(
                  size.y - height - 8,
                  naturalTop < 8 ? anchor.y + 22 : naturalTop,
                ),
              );
              let right = size.x - 8;
              if (
                card &&
                top < card.bottom - surface.top &&
                top + height > card.top - surface.top &&
                card.left - surface.left > width + 16
              )
                right = Math.min(right, card.left - surface.left - 8);
              const left = Math.max(
                8,
                Math.min(right - width, anchor.x - width / 2),
              );
              entry.label.style.setProperty(
                "--label-x",
                `${left - (anchor.x - width / 2)}px`,
              );
              entry.label.style.setProperty(
                "--label-y",
                `${top - naturalTop}px`,
              );
            }
          };
          const stop = () => {
            camera?.kill();
            camera = undefined;
            targetZoom = undefined;
          };
          const moveTo = (center: L.LatLng, zoom: number, duration = 0.58) => {
            stop();
            zoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom));
            if (!motion) {
              map.setView(center, zoom, { animate: false });
              return;
            }
            const current = map.getCenter();
            targetZoom = zoom;
            const view = {
              lat: current.lat,
              lng: current.lng,
              zoom: map.getZoom(),
            };
            camera = gsap.to(view, {
              lat: center.lat,
              lng: center.lng,
              zoom,
              duration,
              ease: "power2.inOut",
              onUpdate: () =>
                map.setView(
                  [view.lat, view.lng],
                  Math.max(map.getMinZoom(), view.zoom),
                  { animate: false },
                ),
              onComplete: () => {
                targetZoom = undefined;
                report();
              },
            });
          };
          const sync = context.add("sync", () => {
            const next = state.current;
            if (lastPoints !== next.points) {
              const slugs = new Set(next.points.map((point) => point.slug));
              for (const [slug, entry] of entries) {
                if (slugs.has(slug) || entry.leaving) continue;
                entry.leaving = true;
                entry.button.disabled = true;
                entry.button.tabIndex = -1;
                entry.button.setAttribute("aria-hidden", "true");
                entry.label.style.display = "none";
                const remove = () => {
                  entry.marker.remove();
                  entries.delete(slug);
                };
                gsap.killTweensOf([entry.symbol, ...entry.symbol.children]);
                if (motion)
                  gsap.to(entry.symbol, {
                    scale: 0.65,
                    opacity: 0,
                    duration: 0.14,
                    onComplete: remove,
                  });
                else remove();
              }
              next.points.forEach((point, index) => {
                const existing = entries.get(point.slug);
                if (existing && !existing.leaving) return;
                if (existing) {
                  gsap.killTweensOf([
                    existing.symbol,
                    ...existing.symbol.children,
                    existing.button,
                    existing.visual,
                  ]);
                  existing.marker.remove();
                  entries.delete(point.slug);
                }
                const button = document.createElement("button");
                button.type = "button";
                button.className = s.pin;
                button.dataset.layer = point.layer;
                button.dataset.point = point.slug;
                button.setAttribute(
                  "aria-label",
                  `${point.code.toUpperCase()} · ${point.name}`,
                );
                button.setAttribute("aria-controls", cardId);
                const symbol = document.createElement("span");
                symbol.className = s.pinSymbol;
                // Two clipped copies preserve the exact source icon at rest.
                for (const part of ["top", "bottom"]) {
                  const image = document.createElement("img");
                  image.src = `/maps/v2/pin-${point.layer}.svg`;
                  image.alt = "";
                  image.draggable = false;
                  image.dataset.part = part;
                  symbol.append(image);
                }
                const label = document.createElement("span");
                label.className = s.pinLabel;
                label.textContent = point.name;
                label.setAttribute("aria-hidden", "true");
                const visual = document.createElement("span");
                visual.className = s.pinVisual;
                visual.append(symbol);
                button.append(visual, label);
                const anchor = L.latLng(
                  artwork.height - point.position.y,
                  point.position.x,
                );
                const marker = L.marker(anchor, {
                  keyboard: false,
                  bubblingMouseEvents: false,
                  icon: L.divIcon({
                    html: button,
                    className: s.markerHost,
                    iconSize: [44, 44],
                    iconAnchor: [22, 22],
                  }),
                }).addTo(map);
                L.DomEvent.disableClickPropagation(button);
                button.addEventListener("click", () =>
                  callbacks.current.onSelect(point, button),
                );
                button.addEventListener("focus", () => {
                  callbacks.current.onHighlight(point.slug);
                  if (
                    button.matches(":focus-visible") &&
                    !map.getBounds().pad(-0.02).contains(anchor)
                  ) {
                    stop();
                    map.panTo(anchor, { animate: false });
                  }
                });
                button.addEventListener("pointerenter", () =>
                  callbacks.current.onHighlight(point.slug),
                );
                button.addEventListener("pointerleave", () => {
                  if (!button.matches(":focus"))
                    callbacks.current.onHighlight(null);
                });
                button.addEventListener("blur", () => {
                  if (!button.matches(":hover"))
                    callbacks.current.onHighlight(null);
                });
                entries.set(point.slug, {
                  button,
                  visual,
                  marker,
                  symbol,
                  label,
                  leaving: false,
                });
                if (motion) {
                  const delay = index * 0.035 + (lastPoints ? 0.08 : 0.2);
                  gsap.from(symbol, {
                    scale: 0.72,
                    opacity: 0,
                    duration: 0.32,
                    delay,
                    ease: "power2.out",
                  });
                  gsap.from(symbol.children, {
                    y: (i) => (i === 0 ? -6 : 6),
                    duration: 0.4,
                    delay,
                    ease: "power3.out",
                  });
                }
              });
            }

            for (const [slug, entry] of entries) {
              if (entry.leaving) continue;
              const active = slug === next.highlighted;
              const chosen = slug === next.selected;
              entry.button.dataset.highlighted = String(active);
              entry.button.setAttribute("aria-pressed", String(chosen));
              entry.marker.setZIndexOffset(active ? 2000 : chosen ? 1000 : 0);
              if (
                lastPoints !== next.points ||
                next.selected !== lastSelected ||
                next.highlighted !== lastHighlighted
              ) {
                gsap.killTweensOf(entry.visual);
                const focus = {
                  y: chosen ? -6 : active ? -4 : 0,
                  scale: chosen ? 1.35 : active ? 1.08 : 1,
                };
                if (motion)
                  gsap.to(entry.visual, {
                    ...focus,
                    duration: chosen ? 0.24 : 0.17,
                    overwrite: true,
                    ease: "power2.out",
                  });
                else gsap.set(entry.visual, focus);
              }
            }

            if (next.selected !== lastSelected) {
              stop();
              const target = next.selected
                ? entries.get(next.selected)
                : undefined;
              if (target) {
                const anchor = target.marker.getLatLng();
                const surface = host.getBoundingClientRect();
                const card = document
                  .getElementById(cardId)
                  ?.getBoundingClientRect();
                const pixel = map.latLngToContainerPoint(anchor);
                const covered =
                  card &&
                  pixel.x + 28 > card.left - surface.left &&
                  pixel.x - 28 < card.right - surface.left &&
                  pixel.y + 28 > card.top - surface.top &&
                  pixel.y - 28 < card.bottom - surface.top;
                if (covered) {
                  const size = map.getSize();
                  const focus = mapFocusPoint(
                    { width: size.x, height: size.y },
                    {
                      left: card.left - surface.left,
                      right: card.right - surface.left,
                      top: card.top - surface.top,
                      bottom: card.bottom - surface.top,
                    },
                  );
                  const zoom = Math.min(
                    map.getMaxZoom(),
                    Math.max(map.getZoom(), map.getMinZoom() + 1),
                  );
                  const center = map.unproject(
                    map
                      .project(anchor, zoom)
                      .add([size.x / 2 - focus.x, size.y / 2 - focus.y]),
                    zoom,
                  );
                  moveTo(center, zoom);
                } else if (!map.getBounds().pad(-0.02).contains(anchor))
                  moveTo(anchor, map.getZoom());
              }
            }
            lastPoints = next.points;
            lastSelected = next.selected;
            lastHighlighted = next.highlighted;
            positionLabels();
          });
          const zoom = context.add("zoom", (delta: number) =>
            moveTo(map.getCenter(), (targetZoom ?? map.getZoom()) + delta, 0.3),
          );
          const reset = context.add("reset", () =>
            moveTo(bounds.getCenter(), map.getMinZoom(), 0.45),
          );
          actions.current = {
            sync: () => sync(),
            stop,
            zoom: (delta) => zoom(delta),
            reset: () => reset(),
          };
          // Interrupt before Leaflet starts a gesture; no tween competes with dragging.
          host.addEventListener("pointerdown", stop, { capture: true });
          host.addEventListener("touchstart", stop, {
            passive: true,
            capture: true,
          });
          map.on("dragstart", stop);
          map.on("move resize", positionLabels);
          sync();
          if (focusedPin) {
            entries.get(focusedPin)?.button.focus({ preventScroll: true });
            focusedPin = undefined;
          }
          return () => {
            const active = document.activeElement as HTMLElement | null;
            focusedPin =
              active && host.contains(active)
                ? active.dataset.point
                : undefined;
            stop();
            actions.current = null;
            host.removeEventListener("pointerdown", stop, true);
            host.removeEventListener("touchstart", stop, true);
            map.off("dragstart", stop);
            map.off("move resize", positionLabels);
            for (const entry of entries.values()) entry.marker.remove();
            entries.clear();
          };
        },
        host,
      );

      const resize = new ResizeObserver(() => {
        if (disposed) return;
        actions.current?.stop();
        const atOverview = map.getZoom() <= map.getMinZoom() + 0.02;
        map.invalidateSize({ animate: false, pan: false });
        updateMinimum();
        if (atOverview || !ready) fit();
        else keepInsideBounds();
        report();
      });
      resize.observe(host);
      return () => {
        disposed = true;
        resize.disconnect();
        media.revert();
        overlay.off();
        map.off();
        map.remove();
        mapRef.current = null;
      };
    },
    {
      scope: element,
      dependencies: [
        artwork.src,
        artwork.width,
        artwork.height,
        cardId,
        ui.design.illustration,
        onViewport,
        onError,
      ],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    state.current = { points, selected, highlighted };
    callbacks.current = { onSelect, onHighlight };
    actions.current?.sync();
  }, [points, selected, highlighted, onSelect, onHighlight]);

  return (
    <div
      ref={element}
      className={s.mapSurface}
      role="region"
      aria-label={ui.canvas}
      aria-describedby={helpId}
      tabIndex={0}
      onKeyDown={(event) => {
        const map = mapRef.current;
        if (
          !map ||
          event.target !== event.currentTarget ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return;
        const offsets: Record<string, [number, number]> = {
          ArrowLeft: [-80, 0],
          ArrowRight: [80, 0],
          ArrowUp: [0, -80],
          ArrowDown: [0, 80],
        };
        const offset = offsets[event.key];
        if (offset) {
          actions.current?.stop();
          map.panBy(offset, { animate: false });
        } else if (event.key === "+" || event.key === "=")
          actions.current?.zoom(0.5);
        else if (event.key === "-" || event.key === "_")
          actions.current?.zoom(-0.5);
        else if (event.key === "Home") actions.current?.reset();
        else return;
        event.preventDefault();
        event.stopPropagation();
      }}
    />
  );
}
