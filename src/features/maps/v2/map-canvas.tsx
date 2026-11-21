"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Dictionary } from "@/i18n/dictionaries";
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

export default function DesignMapCanvas({
  ref,
  artwork,
  points,
  selected,
  cardId,
  helpId,
  onSelect,
  onViewport,
  onError,
  ui,
}: {
  ref: Ref<DesignMapControls>;
  artwork: { src: string; width: number; height: number };
  points: DesignMapPoint[];
  selected: string | null;
  cardId: string;
  helpId: string;
  onSelect: (point: DesignMapPoint, trigger: HTMLElement) => void;
  onViewport: (value: DesignMapViewport) => void;
  onError: () => void;
  ui: Dictionary["maps"];
}) {
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fitRef = useRef<() => void>(() => {});
  const markers = useRef(
    new Map<string, { marker: L.Marker; button: HTMLButtonElement }>(),
  );
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useImperativeHandle(
    ref,
    () => ({
      zoom: (delta) =>
        mapRef.current?.setZoom(mapRef.current.getZoom() + delta, {
          animate: false,
        }),
      reset: () => fitRef.current(),
    }),
    [],
  );

  useEffect(() => {
    if (!element.current) return;
    const bounds = L.latLngBounds([0, 0], [artwork.height, artwork.width]);
    const map = L.map(element.current, {
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
      maxBounds: bounds.pad(0.35),
      maxBoundsViscosity: 1,
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
    const fit = () => {
      map.fitBounds(bounds, { padding: [0, 0], animate: false });
    };
    fitRef.current = fit;
    fit();
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
    const resize = new ResizeObserver(() => {
      if (disposed) return;
      const atOverview = map.getZoom() <= map.getMinZoom() + 0.02;
      map.invalidateSize({ animate: false, pan: false });
      const size = map.getSize();
      const minimum = Math.log2(
        Math.min(size.x / artwork.width, size.y / artwork.height),
      );
      if (!Number.isFinite(minimum)) return;
      map.setMinZoom(minimum);
      if (atOverview || !ready) fit();
      report();
    });
    resize.observe(element.current);
    return () => {
      disposed = true;
      resize.disconnect();
      overlay.off();
      map.off();
      map.remove();
      mapRef.current = null;
      fitRef.current = () => {};
    };
  }, [
    artwork.src,
    artwork.width,
    artwork.height,
    ui.design.illustration,
    onViewport,
    onError,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const entries = markers.current;
    for (const point of points) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = s.pin;
      button.dataset.layer = point.layer;
      button.setAttribute(
        "aria-label",
        `${point.code.toUpperCase()} · ${point.name}`,
      );
      button.setAttribute("aria-controls", cardId);
      const symbol = document.createElement("img");
      symbol.src = `/maps/v2/pin-${point.layer}.svg`;
      symbol.alt = "";
      symbol.draggable = false;
      const label = document.createElement("span");
      label.className = s.pinLabel;
      label.textContent = point.name;
      label.setAttribute("aria-hidden", "true");
      button.append(symbol, label);
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
      button.addEventListener("click", () => selectRef.current(point, button));
      button.addEventListener("focus", () => {
        marker.setZIndexOffset(1000);
        if (
          button.matches(":focus-visible") &&
          !map.getBounds().pad(-0.02).contains(anchor)
        )
          map.panTo(anchor, { animate: false });
      });
      button.addEventListener("pointerenter", () =>
        marker.setZIndexOffset(1000),
      );
      button.addEventListener("pointerleave", () =>
        marker.setZIndexOffset(
          button.getAttribute("aria-pressed") === "true" ? 1000 : 0,
        ),
      );
      button.addEventListener("blur", () =>
        marker.setZIndexOffset(
          button.getAttribute("aria-pressed") === "true" ? 1000 : 0,
        ),
      );
      entries.set(point.slug, { marker, button });
    }
    return () => {
      for (const { marker } of entries.values()) marker.remove();
      entries.clear();
    };
  }, [points, artwork.src, artwork.width, artwork.height, cardId]);

  useEffect(() => {
    for (const [slug, { button, marker }] of markers.current) {
      button.setAttribute("aria-pressed", String(slug === selected));
      marker.setZIndexOffset(slug === selected ? 1000 : 0);
    }
    const target = selected ? markers.current.get(selected) : undefined;
    const map = mapRef.current;
    if (
      target &&
      map &&
      !map.getBounds().pad(-0.02).contains(target.marker.getLatLng())
    )
      map.panTo(target.marker.getLatLng(), { animate: false });
  }, [selected, points]);

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
        if (offset) map.panBy(offset, { animate: false });
        else if (event.key === "+" || event.key === "=")
          map.zoomIn(0.5, { animate: false });
        else if (event.key === "-" || event.key === "_")
          map.zoomOut(0.5, { animate: false });
        else if (event.key === "Home") fitRef.current();
        else return;
        event.preventDefault();
        event.stopPropagation();
      }}
    />
  );
}
