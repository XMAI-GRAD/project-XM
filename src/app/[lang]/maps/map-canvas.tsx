"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Layer } from "@/content";
import type { Dictionary } from "@/i18n/dictionaries";
import type { MapGroup, MapImage } from "./map-explorer";
import s from "./page.module.css";

export interface MapControls {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
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
  onSelect: (slug: string) => void;
  onViewport: (viewport: MapViewport) => void;
  onError: () => void;
  ui: Dictionary["maps"];
}

export default function MapCanvas({
  ref,
  artwork,
  points,
  layer,
  selectedSlug,
  selectionKey,
  onSelect,
  onViewport,
  onError,
  ui,
}: MapCanvasProps) {
  const surface = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef(
    new Map<string, { marker: L.Marker; button: HTMLButtonElement }>(),
  );
  const resetRef = useRef<() => void>(() => {});

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.zoomIn(0.5, { animate: false }),
      zoomOut: () => mapRef.current?.zoomOut(0.5, { animate: false }),
      reset: () => resetRef.current(),
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
      maxBounds: bounds.pad(0.35),
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
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
      map.fitBounds(bounds, { padding: [20, 20], animate: false });
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
          Math.max(1, size.x - 40) / artwork.width,
          Math.max(1, size.y - 40) / artwork.height,
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
      button.setAttribute("aria-controls", "map-place-card");
      button.title = point.name;
      button.textContent = point.code;
      const select = () => onSelect(point.slug);
      L.DomEvent.disableClickPropagation(button);
      button.addEventListener("click", select);
      const marker = L.marker(
        [artwork.height - point.mapPosition.y, point.mapPosition.x],
        {
          icon: L.divIcon({
            html: button,
            className: s.markerHost,
            iconSize: [44, 52],
            iconAnchor: [22, 52],
          }),
          keyboard: false,
          bubblingMouseEvents: false,
        },
      ).addTo(map);
      entries.set(point.slug, { marker, button });
    }
    return () => {
      for (const { marker } of entries.values()) marker.remove();
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
    if (!selected) return;
    const size = map.getSize();
    // Keep the selected pin in the free space beside (or above) the detail card.
    const target =
      size.x >= 640
        ? L.point((size.x - 348) / 2, size.y / 2)
        : L.point(size.x / 2, 170);
    const zoom = Math.min(
      map.getMaxZoom(),
      Math.max(map.getZoom(), map.getMinZoom() + 0.75),
    );
    const center = map.unproject(
      map
        .project(selected.marker.getLatLng(), zoom)
        .subtract(target.subtract(size.divideBy(2))),
      zoom,
    );
    map.setView(center, zoom, { animate: false });
  }, [
    selectedSlug,
    selectionKey,
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
      aria-describedby="map-keyboard-help"
    />
  );
}
