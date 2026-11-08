"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
  type RefObject,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Layer } from "@/content";
import type { Dictionary } from "@/i18n/dictionaries";
import { mapFocusPoint, spreadMapPins } from "@/features/maps/layout";
import type { MapGroup, MapImage } from "./map-explorer";
import s from "./page.module.css";

export interface MapControls {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  locate: () => void;
}

export interface MapViewport {
  ready: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

interface MapCanvasProps {
  ref: Ref<MapControls>;
  artwork: MapImage;
  points: MapGroup["points"];
  layer: Layer;
  selectedSlug: string | null;
  selectionKey: number;
  cardRef: RefObject<HTMLElement | null>;
  cardId: string;
  keyboardHelpId: string;
  onSelect: (slug: string, trigger: HTMLElement) => void;
  onViewport: (viewport: MapViewport) => void;
  onError: () => void;
  ui: Dictionary["maps"];
}

function focusTarget(map: L.Map, cardElement: HTMLElement | null) {
  const size = map.getSize();
  const rect = map.getContainer().getBoundingClientRect();
  const card = cardElement?.getBoundingClientRect();
  const target = mapFocusPoint(
    { width: size.x, height: size.y },
    card
      ? {
          left: card.left - rect.left,
          top: card.top - rect.top,
          right: card.right - rect.left,
          bottom: card.bottom - rect.top,
        }
      : undefined,
  );
  return L.point(target.x, target.y);
}

export default function MapCanvas({
  ref,
  artwork,
  points,
  layer,
  selectedSlug,
  selectionKey,
  cardRef,
  cardId,
  keyboardHelpId,
  onSelect,
  onViewport,
  onError,
  ui,
}: MapCanvasProps) {
  const surface = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef(
    new Map<
      string,
      {
        marker: L.Marker;
        button: HTMLButtonElement;
        anchor: L.LatLng;
        leader: L.Polyline;
      }
    >(),
  );
  const resetRef = useRef<() => void>(() => {});
  const locateRef = useRef<() => void>(() => {});

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(0.5, { animate: false }),
      zoomOut: () => mapRef.current?.zoomOut(0.5, { animate: false }),
      reset: () => resetRef.current(),
      locate: () => {
        locateRef.current();
        surface.current?.focus({ preventScroll: true });
        surface.current?.scrollIntoView({
          block: "nearest",
          behavior: "instant",
        });
      },
    }),
    [],
  );

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const bounds = L.latLngBounds([0, 0], [artwork.height, artwork.width]);
    const map = L.map(element, {
      crs: L.CRS.Simple,
      minZoom: -5,
      maxZoom: 1.5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      // Extra room is needed to place an edge pin beside a wide detail card.
      maxBounds: bounds.pad(1),
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      // Leaflet's built-in keyboard pan animates even with zoomAnimation off.
      keyboard: false,
      // Direct manipulation only; no motion that ignores reduced-motion preferences.
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
      bounceAtZoomLimits: false,
    });
    mapRef.current = map;
    let imageLoaded = false;
    let disposed = false;
    const reportViewport = () =>
      onViewport({
        ready: imageLoaded,
        canZoomIn: map.getZoom() < map.getMaxZoom(),
        canZoomOut: map.getZoom() > map.getMinZoom(),
      });
    const fit = () =>
      map.fitBounds(bounds, {
        paddingTopLeft: [32, 72],
        paddingBottomRight: [32, 24],
        animate: false,
      });
    resetRef.current = fit;
    fit();
    const overlay = L.imageOverlay(artwork.src, bounds, {
      alt: artwork.alt,
      className: s.artwork,
      opacity: 0.85,
      interactive: false,
    });
    overlay.on("load", () => {
      if (disposed) return;
      imageLoaded = true;
      reportViewport();
    });
    overlay.on("error", () => {
      if (!disposed) onError();
    });
    overlay.addTo(map);
    map.on("zoomend zoomlevelschange", reportViewport);

    // A map embedded in a resizable grid needs more than window resize events.
    const resize = new ResizeObserver(() => {
      if (disposed) return;
      map.invalidateSize({ animate: false, pan: false });
      const size = map.getSize();
      // Calculate without getBoundsZoom's current-minimum clamp, so shrinking
      // the viewport can lower the minimum zoom as well as raise it.
      const fitZoom = Math.log2(
        Math.min(
          Math.max(1, size.x - 64) / artwork.width,
          Math.max(1, size.y - 96) / artwork.height,
        ),
      );
      const minimum = Math.max(-5, Math.min(1.5, Math.floor(fitZoom * 4) / 4));
      const wasShowingWholeMap = map.getZoom() <= map.getMinZoom();
      map.setMinZoom(minimum);
      if (wasShowingWholeMap) fit();
      reportViewport();
    });
    resize.observe(element);
    return () => {
      disposed = true;
      resize.disconnect();
      overlay.off();
      map.off();
      map.remove();
      mapRef.current = null;
      resetRef.current = () => {};
    };
  }, [
    artwork.src,
    artwork.alt,
    artwork.width,
    artwork.height,
    onViewport,
    onError,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const entries = markers.current;
    for (const point of points) {
      if (!point.mapPosition) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = s.mapPin;
      button.dataset.layer = layer;
      button.setAttribute(
        "aria-label",
        `${point.code.toUpperCase()} · ${point.name}`,
      );
      button.setAttribute("aria-controls", cardId);
      const code = document.createElement("span");
      code.textContent = point.code;
      const label = document.createElement("span");
      label.className = s.pinLabel;
      label.setAttribute("aria-hidden", "true");
      label.textContent = point.name;
      button.append(code, label);
      const select = () => onSelect(point.slug, button);
      L.DomEvent.disableClickPropagation(button);
      button.addEventListener("click", select);
      const anchor = L.latLng(
        artwork.height - point.mapPosition.y,
        point.mapPosition.x,
      );
      const marker = L.marker(anchor, {
        icon: L.divIcon({
          html: button,
          className: s.markerHost,
          iconSize: [44, 52],
          iconAnchor: [22, 52],
        }),
        keyboard: false,
        bubblingMouseEvents: false,
      }).addTo(map);
      const leader = L.polyline([], {
        className: s.pinLeader,
        weight: 2,
        opacity: 1,
        interactive: false,
      }).addTo(map);
      const showLabel = () => {
        marker.setZIndexOffset(2000);
        button.dataset.labelPosition =
          map.latLngToContainerPoint(marker.getLatLng()).y < 140
            ? "below"
            : "above";
        button.dataset.label = "visible";
        label.style.setProperty("--pin-label-shift", "0px");
        const labelBox = label.getBoundingClientRect();
        const viewportBox = map.getContainer().getBoundingClientRect();
        const shift =
          Math.max(0, viewportBox.left + 8 - labelBox.left) -
          Math.max(0, labelBox.right - viewportBox.right + 8);
        label.style.setProperty("--pin-label-shift", `${shift}px`);
      };
      const hideLabel = () => {
        marker.setZIndexOffset(
          button.getAttribute("aria-pressed") === "true" ? 1000 : 0,
        );
        delete button.dataset.label;
      };
      button.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") showLabel();
      });
      button.addEventListener("pointerleave", hideLabel);
      button.addEventListener("focus", () => {
        // Only keyboard focus recenters. Moving a button between pointer-down
        // and pointer-up would cancel a mouse/touch click near the map edge.
        if (!button.matches(":focus-visible")) return;
        const offset = focusTarget(map, cardRef.current).subtract(
          map.getSize().divideBy(2),
        );
        const center = map.unproject(
          map.project(marker.getLatLng()).subtract(offset),
        );
        map.panTo(center, { animate: false });
        showLabel();
      });
      button.addEventListener("blur", hideLabel);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.dataset.label) {
          hideLabel();
        }
      });
      entries.set(point.slug, { marker, button, anchor, leader });
    }
    const separatePins = () => {
      const pins = [...entries].map(([id, { anchor }]) => ({
        id,
        ...map.project(anchor, map.getZoom()),
      }));
      const positions = spreadMapPins(pins);
      for (const [id, entry] of entries) {
        const pixel = positions.get(id)!;
        const location = map.unproject([pixel.x, pixel.y], map.getZoom());
        entry.marker.setLatLng(location);
        entry.leader.setLatLngs(
          location.equals(entry.anchor) ? [] : [entry.anchor, location],
        );
      }
    };
    separatePins();
    map.on("zoomend", separatePins);
    // A layer switch or a new search starts with its pins in view.
    resetRef.current();
    return () => {
      map.off("zoomend", separatePins);
      for (const { marker, leader } of entries.values()) {
        marker.remove();
        leader.remove();
      }
      entries.clear();
    };
  }, [
    points,
    layer,
    artwork.src,
    artwork.alt,
    artwork.width,
    artwork.height,
    onSelect,
    cardRef,
    cardId,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [slug, { marker, button }] of markers.current) {
      button.setAttribute("aria-pressed", String(slug === selectedSlug));
      marker.setZIndexOffset(slug === selectedSlug ? 1000 : 0);
    }
    const selected = selectedSlug
      ? markers.current.get(selectedSlug)
      : undefined;
    if (!selected) {
      locateRef.current = () => {};
      return;
    }
    const locate = () => {
      const element = surface.current;
      if (!element) return;
      map.invalidateSize({ animate: false, pan: false });
      const size = map.getSize();
      const target = focusTarget(map, cardRef.current);
      const zoom = Math.min(
        map.getMaxZoom(),
        Math.max(map.getZoom(), map.getMinZoom() + 0.75),
      );
      // Compute the button's displacement at the destination zoom, so even
      // coincident pins land in the unoccluded part of the map.
      const positions = spreadMapPins(
        [...markers.current].map(([id, { anchor }]) => ({
          id,
          ...map.project(anchor, zoom),
        })),
      );
      const pin = positions.get(selectedSlug!)!;
      const center = map.unproject(
        L.point(pin.x, pin.y).subtract(target.subtract(size.divideBy(2))),
        zoom,
      );
      map.setView(center, zoom, { animate: false });
    };
    locateRef.current = locate;
    locate();
    // Observe the actual layout, not a guessed mobile breakpoint/card height.
    // Only selection/layout changes recenter; ordinary panning stays free.
    const resize = new ResizeObserver(locate);
    if (surface.current) resize.observe(surface.current);
    if (cardRef.current) resize.observe(cardRef.current);
    return () => {
      resize.disconnect();
      locateRef.current = () => {};
    };
  }, [
    selectedSlug,
    selectionKey,
    cardRef,
    points,
    artwork.src,
    artwork.alt,
    artwork.width,
    artwork.height,
  ]);

  return (
    <div
      ref={surface}
      className={s.mapSurface}
      role="region"
      aria-label={ui.canvas}
      aria-describedby={keyboardHelpId}
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
        const distance = event.shiftKey ? 240 : 80;
        const offsets: Record<string, [number, number]> = {
          ArrowLeft: [-distance, 0],
          ArrowRight: [distance, 0],
          ArrowUp: [0, -distance],
          ArrowDown: [0, distance],
        };
        const offset = offsets[event.key];
        if (offset) {
          const center = map.unproject(
            map.project(map.getCenter()).add(offset),
          );
          map.panTo(center, { animate: false });
        } else if (event.key === "+" || event.key === "=") {
          map.zoomIn(0.5, { animate: false });
        } else if (event.key === "-" || event.key === "_") {
          map.zoomOut(0.5, { animate: false });
        } else return;
        event.preventDefault();
        event.stopPropagation();
      }}
    />
  );
}
