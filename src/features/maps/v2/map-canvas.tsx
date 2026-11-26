"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import type { Dictionary } from "@/i18n/dictionaries";
import { artworkLabelLayout } from "./label-side";
import { selectedMapView } from "./selected-view";
import type { DesignMapOrigin, DesignMapPoint } from "./types";
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
  routeVisible: boolean;
  highlighted: string | null;
};

export default function DesignMapCanvas({
  ref,
  artwork,
  origin,
  points,
  selected,
  routeVisible,
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
  origin: DesignMapOrigin;
  points: DesignMapPoint[];
  selected: string | null;
  routeVisible: boolean;
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
  const state = useRef<MapState>({
    points,
    selected,
    routeVisible,
    highlighted,
  });
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

      // The configured starting point is independent of theme/search results.
      const originElement = document.createElement("div");
      originElement.className = `${s.pin} ${s.originPin}`;
      originElement.dataset.origin = "true";
      originElement.setAttribute("role", "img");
      originElement.setAttribute(
        "aria-label",
        `${ui.design.origin}: ${origin.name}`,
      );
      const originBadge = document.createElement("span");
      originBadge.className = s.originBadge;
      originBadge.textContent = ui.design.you;
      originBadge.setAttribute("aria-hidden", "true");
      const originLabel = document.createElement("span");
      originLabel.className = s.pinLabel;
      originLabel.setAttribute("aria-hidden", "true");
      const originCaption = document.createElement("strong");
      originCaption.textContent = ui.design.origin;
      const originName = document.createElement("span");
      originName.textContent = origin.name;
      originLabel.append(originCaption, originName);
      originElement.append(originBadge, originLabel);
      L.marker([artwork.height - origin.position.y, origin.position.x], {
        keyboard: false,
        interactive: false,
        zIndexOffset: 500,
        icon: L.divIcon({
          html: originElement,
          className: s.markerHost,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      }).addTo(map);

      let focusedPin: string | undefined;
      let fittedView = "";
      const media = gsap.matchMedia();
      media.add(
        { motion: MOTION, reduced: "(prefers-reduced-motion: reduce)" },
        (context) => {
          const motion = !!context.conditions?.motion;
          const entries = new Map<string, MarkerEntry>();
          const routeRenderer = L.svg({ padding: 0.5 });
          let route: L.Polyline | undefined;
          let routeReveal: gsap.core.Tween | undefined;
          let camera: gsap.core.Tween | undefined;
          let targetZoom: number | undefined;
          let lastPoints: DesignMapPoint[] | undefined;
          let lastSelected: string | null = null;
          let lastRouteVisible = false;
          let lastHighlighted: string | null = null;
          let labelsActive = true;
          const updateLabel = (
            label: HTMLElement,
            anchor: { x: number; y: number },
          ) => {
            if (!labelsActive || !label.offsetWidth) return;
            const layout = artworkLabelLayout({
              artwork,
              anchor,
              label: label.getBoundingClientRect(),
              scale: 2 ** map.getZoom(),
            });
            if (label.dataset.side !== layout.side)
              label.dataset.side = layout.side;
          };
          const updateEntryLabel = (entry: MarkerEntry) => {
            const anchor = entry.marker.getLatLng();
            updateLabel(entry.label, {
              x: anchor.lng,
              y: artwork.height - anchor.lat,
            });
          };
          const updateLabels = () => {
            if (!labelsActive) return;
            updateLabel(originLabel, origin.position);
            for (const entry of entries.values())
              if (!entry.leaving) updateEntryLabel(entry);
          };
          const labelResize = new ResizeObserver(updateLabels);
          labelResize.observe(originLabel);
          map.on("zoom resize", updateLabels);
          document.fonts.addEventListener("loadingdone", updateLabels);
          void document.fonts.ready.then(updateLabels);
          const dismissLabel = (event: KeyboardEvent) => {
            if (
              event.key !== "Escape" ||
              state.current.selected ||
              !state.current.highlighted
            )
              return;
            const entry = entries.get(state.current.highlighted);
            if (!entry || !entry.label.offsetWidth) return;
            entry.button.dataset.labelDismissed = "true";
            event.stopPropagation();
          };
          document.addEventListener("keydown", dismissLabel, true);
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
              onUpdate: () => {
                if (!camera) return;
                map.setView(
                  [view.lat, view.lng],
                  Math.max(map.getMinZoom(), view.zoom),
                  { animate: false },
                );
              },
              onComplete: () => {
                targetZoom = undefined;
                report();
              },
            });
          };
          const revealSelected = (entry: MarkerEntry, immediate = false) => {
            updateEntryLabel(entry);
            const surface = host.getBoundingClientRect();
            const pin = entry.button.getBoundingClientRect();
            const label = entry.label.getBoundingClientRect();
            const anchor = entry.marker.getLatLng();
            const pinX = (pin.left + pin.right) / 2;
            const pinY = (pin.top + pin.bottom) / 2;
            const relative = (rect: DOMRect) => ({
              left: rect.left - surface.left,
              right: rect.right - surface.left,
              top: rect.top - surface.top,
              bottom: rect.bottom - surface.top,
            });
            const obstacles = Array.from(
              host.parentElement!.querySelectorAll<HTMLElement>(
                `.${s.locationCard}, .${s.legend}, .${s.legendPopover}, .${s.compass}`,
              ),
            )
              .map((el) => relative(el.getBoundingClientRect()))
              .filter(
                (rect) =>
                  rect.right > 0 &&
                  rect.left < surface.width &&
                  rect.bottom > 0 &&
                  rect.top < surface.height,
              );
            if (getComputedStyle(host.parentElement!).maskImage !== "none") {
              const corner = (surface.width * 46) / artwork.width;
              obstacles.push(
                {
                  left: surface.width - corner,
                  right: surface.width,
                  top: 0,
                  bottom: corner,
                },
                {
                  left: surface.width - corner,
                  right: surface.width,
                  top: surface.height - corner,
                  bottom: surface.height,
                },
              );
            }
            const view = selectedMapView({
              artwork,
              viewport: surface,
              anchor: { x: anchor.lng, y: artwork.height - anchor.lat },
              footprint: (scale) =>
                artworkLabelLayout({
                  artwork,
                  anchor: { x: anchor.lng, y: artwork.height - anchor.lat },
                  label,
                  scale,
                }).footprint,
              preferred: { x: pinX - surface.left, y: pinY - surface.top },
              scale: 2 ** map.getZoom(),
              maxScale: 2 ** map.getMaxZoom(),
              obstacles,
            });
            if (!view) return; // The accessible details card remains available.
            const center = L.latLng(
              artwork.height - view.center.y,
              view.center.x,
            );
            const zoom = Math.log2(view.scale);
            if (immediate) {
              stop();
              map.setView(center, zoom, { animate: false });
            } else moveTo(center, zoom);
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
                  labelResize.unobserve(entry.label);
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
                  labelResize.unobserve(existing.label);
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
                labelResize.observe(label);
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
                  delete button.dataset.labelDismissed;
                  callbacks.current.onHighlight(point.slug);
                  const entry = entries.get(point.slug);
                  if (entry && button.matches(":focus-visible"))
                    revealSelected(entry, true);
                });
                button.addEventListener("pointerenter", () => {
                  delete button.dataset.labelDismissed;
                  callbacks.current.onHighlight(point.slug);
                  const entry = entries.get(point.slug);
                  if (entry) updateEntryLabel(entry);
                });
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
              if (next.highlighted !== lastHighlighted)
                delete entry.button.dataset.labelDismissed;
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

            updateLabels();
            if (
              next.selected !== lastSelected ||
              next.routeVisible !== lastRouteVisible ||
              lastPoints !== next.points
            ) {
              routeReveal?.kill();
              route?.remove();
              route = undefined;
              const destination = next.points.find(
                (point) => point.slug === next.selected,
              );
              if (destination && next.routeVisible) {
                route = L.polyline(
                  destination.route.map(([x, y]) => [artwork.height - y, x]),
                  {
                    renderer: routeRenderer,
                    className: s.route,
                    interactive: false,
                    bubblingMouseEvents: false,
                    weight: 3,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                    // Keep the reveal's length stable during camera movement.
                    noClip: true,
                    smoothFactor: 0,
                  },
                ).addTo(map);
                const path = route.getElement();
                if (path) {
                  path.setAttribute("data-route", destination.slug);
                  path.setAttribute("data-layer", destination.layer);
                  path.setAttribute("aria-hidden", "true");
                  path.setAttribute("pathLength", "1");
                  if (motion)
                    routeReveal = gsap.fromTo(
                      path,
                      { strokeDasharray: "1 1", strokeDashoffset: 1 },
                      {
                        strokeDashoffset: 0,
                        // pathLength=1 needs fractional offsets throughout.
                        autoRound: false,
                        duration: 0.8,
                        ease: "power1.inOut",
                        clearProps: "strokeDasharray,strokeDashoffset",
                      },
                    );
                }
              }
            }

            const view = `${next.selected ?? ""}:${next.routeVisible}`;
            if (view !== fittedView) {
              stop();
              fittedView = view;
              const target = next.selected
                ? entries.get(next.selected)
                : undefined;
              if (route) {
                // Route view has no card: frame both endpoints together.
                const routeBounds = route.getBounds();
                moveTo(
                  routeBounds.getCenter(),
                  map.getBoundsZoom(routeBounds, false, L.point(80, 100)),
                );
              } else if (target) revealSelected(target);
            }
            lastPoints = next.points;
            lastSelected = next.selected;
            lastHighlighted = next.highlighted;
            lastRouteVisible = next.routeVisible;
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
            routeReveal?.kill();
            route?.remove();
            routeRenderer.remove();
            actions.current = null;
            labelsActive = false;
            labelResize.disconnect();
            map.off("zoom resize", updateLabels);
            document.fonts.removeEventListener("loadingdone", updateLabels);
            document.removeEventListener("keydown", dismissLabel, true);
            host.removeEventListener("pointerdown", stop, true);
            host.removeEventListener("touchstart", stop, true);
            map.off("dragstart", stop);
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
        if (state.current.selected) {
          fittedView = "";
          actions.current?.sync();
        }
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
        origin.name,
        origin.position.x,
        origin.position.y,
        ui.design.origin,
        ui.design.you,
        cardId,
        ui.design.illustration,
        onViewport,
        onError,
      ],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    state.current = { points, selected, routeVisible, highlighted };
    callbacks.current = { onSelect, onHighlight };
    actions.current?.sync();
  }, [points, selected, routeVisible, highlighted, onSelect, onHighlight]);

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
