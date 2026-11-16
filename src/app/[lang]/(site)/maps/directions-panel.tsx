"use client";

import type { RefObject } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { SavedMapRoute } from "@/features/maps/catalogue";
import type { MapGroup } from "./map-explorer";
import s from "./page.module.css";

export function DirectionsPanel({
  id,
  lang,
  groups,
  routes,
  from,
  to,
  route,
  ready,
  fromRef,
  onChange,
  onFit,
  ui,
}: {
  id: string;
  lang: Locale;
  groups: MapGroup[];
  routes: SavedMapRoute[];
  from: string;
  to: string;
  route?: SavedMapRoute;
  ready: boolean;
  fromRef: RefObject<HTMLSelectElement | null>;
  onChange: (from: string, to: string) => void;
  onFit: () => void;
  ui: Dictionary["maps"];
}) {
  const points = groups.flatMap((g) => g.points);
  const origin = points.find((p) => p.slug === from),
    destination = points.find((p) => p.slug === to);
  const locale = lang === "vi" ? "vi-VN" : "en-GB";
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const distance = route
    ? route.distanceMeters < 1000
      ? `${Math.round(route.distanceMeters)} m`
      : `${number.format(route.distanceMeters / 1000)} km`
    : "";
  const minutes = route ? Math.ceil(route.durationSeconds / 60) : 0;
  const time =
    minutes < 60
      ? `${minutes} ${ui.minutes}`
      : `${Math.floor(minutes / 60)} ${ui.hours} ${minutes % 60} ${ui.minutes}`;
  function clear() {
    onChange("", "");
    fromRef.current?.focus();
  }
  const options = groups.map((g) => (
    <optgroup label={g.name} key={g.layer}>
      {g.points.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.code.toUpperCase()} · {p.name}
        </option>
      ))}
    </optgroup>
  ));
  return (
    <div className={s.directionsPanel}>
      <p className={s.directionIntro}>{ui.directionsIntro}</p>
      <div className={s.endpointFields}>
        <label htmlFor={`${id}-from`}>
          <span className={s.endpointBadge}>A</span>
          {ui.from}
        </label>
        <select
          id={`${id}-from`}
          ref={fromRef}
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
        >
          <option value="">{ui.choosePlace}</option>
          {options}
        </select>
        <button
          type="button"
          className={s.swapRoute}
          onClick={() => onChange(to, from)}
          disabled={!from && !to}
        >
          {ui.swap}
        </button>
        <label htmlFor={`${id}-to`}>
          <span className={s.endpointBadge}>B</span>
          {ui.to}
        </label>
        <select
          id={`${id}-to`}
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
        >
          <option value="">{ui.choosePlace}</option>
          {options}
        </select>
      </div>
      <div
        className={s.routeStatus}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {route ? (
          <>
            <p className="meta">{ui.walking}</p>
            <p className={s.routeMetrics}>
              <strong>{distance}</strong>
              <span>≈ {time}</span>
            </p>
            <p>
              {origin?.name} → {destination?.name}
            </p>
          </>
        ) : (
          <p>
            {from && to
              ? from === to
                ? ui.samePlace
                : ui.routeUnavailable
              : ui.chooseEndpoints}
          </p>
        )}
      </div>
      {route && (
        <>
          <div className={s.routeActions}>
            <button type="button" onClick={onFit} disabled={!ready}>
              {ui.fitRoute}
            </button>
            <button type="button" onClick={clear}>
              {ui.clearRoute}
            </button>
          </div>
          <p className={s.routeNotice}>{ui.routeNotice}</p>
          <details className={s.routeDetails}>
            <summary>{ui.routeDetails}</summary>
            <p>
              <strong>A · {origin?.name}</strong>
              <br />
              {origin?.mapNote}
            </p>
            <p>
              <strong>B · {destination?.name}</strong>
              <br />
              {destination?.mapNote}
            </p>
            <p>{ui.endpointNote}</p>
            <p>
              {ui.savedOn}{" "}
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(new Date(route.savedOn))}
            </p>
            <a href={route.sourceUrl} target="_blank" rel="noreferrer">
              {ui.routeSource}
            </a>
          </details>
        </>
      )}
      {!route && (from || to) && (
        <button type="button" className={s.textAction} onClick={clear}>
          {ui.clearRoute}
        </button>
      )}
      <section className={s.savedRoutes} aria-labelledby={`${id}-saved`}>
        <h2 id={`${id}-saved`} className="meta">
          {ui.savedRoutes} <span>({routes.length})</span>
        </h2>
        <p>{ui.savedRoutesHint}</p>
        <ul>
          {routes.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={route?.id === r.id}
                onClick={() => onChange(r.from, r.to)}
              >
                <span>{points.find((p) => p.slug === r.from)?.name}</span>
                <span aria-hidden="true">↓</span>
                <span>{points.find((p) => p.slug === r.to)?.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
