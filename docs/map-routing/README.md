# Hanoi route-alignment prototype

This is an offline engineering review of four real walking routes on the existing artwork. The public `/vi/maps` and `/en/maps` interfaces are not connected to a routing service yet.

## Open the review

From the project root, with the project's existing dependencies installed:

```powershell
node docs/map-routing/serve-review.mjs
```

Open **http://127.0.0.1:4318**. The server binds only to loopback and serves an explicit list of review assets. Stop it with Ctrl+C. Alternatively, open `docs/map-routing/review.html` directly in a browser from this checkout.

Select a sample; use Fit route, Whole artwork, zoom/pan buttons or arrow keys. Toggle the line and reduce its opacity to compare it with the original road drawing. The review makes no route/tile requests. English engineering labels are local to this documentation artifact, not new product UI strings.

## Reproduce

```powershell
node --conditions=react-server --experimental-strip-types docs/map-routing/build-review.mjs
```

Requires Node 24 for the existing documentation content-loader hook. It uses the same validated content and calibration as the application. Source hashes in `measurements.json` bind the report to the saved response files. The builder rejects changed canonical endpoint coordinates so an old route cannot silently pass as a new one.

The four saved snapshots came from explicit requests on 9 November 2026, spaced more than one second apart, with an identifying User-Agent. No scheduled refresh, full route matrix or CI network calls were added. The fetch helper refuses to overwrite an existing snapshot; archive a reviewed snapshot explicitly before refreshing one. Re-read the provider's current policy before further calls.

```powershell
# Research use only; runs one selected sample, only when its saved file is absent.
node --conditions=react-server --experimental-strip-types docs/map-routing/fetch-sample.mjs central
```

Other sample names: `lake`, `outer`, `bridge`. The ignored local timestamp guards sequential invocations against accidental rapid requests; it is not a production/distributed limiter and is not safe for concurrent research invocations.

## Evidence and interpretation

All **648 vertices** across four samples lie inside the artwork. Endpoint gaps range from roughly 0.03 to 18.33 m. This confirms the coordinate/rendering pipeline, not universal alignment or pedestrian access. The visual findings and provider decision are in [the research note](../../research/map-routing/README.md).

The close views below expose missing detail and local offsets rather than hiding them under a thick line. A/B are requested canonical pins. Teal dots are the route's actual endpoints. Dashed gaps are diagnostic connectors, not navigation instructions.

- [Central entrance route](screenshots/central.png): recognizable corridor alignment, with local departures from grey strokes.
- [Ngọc Sơn approach](screenshots/lake.png): fine pedestrian/bridge geometry not represented adequately by the street-only image.
- [Vạn Phúc route](screenshots/outer.png): broad corridor agreement, extending southwest beyond the original control-point footprint.
- [Long Biên reference route](screenshots/bridge.png): bridge geometry aligns broadly, but its destination remains a point on the bridge rather than a verified access entrance.

Route rendering and snapshots: OSRM / [FOSSGIS](https://routing.openstreetmap.de/about.html). Geographic data: [© OpenStreetMap contributors, ODbL](https://www.openstreetmap.org/copyright). [Fix the map](https://www.openstreetmap.org/fixthemap). Artwork: supplied by the project owner. Screenshots belong to this credited review and are not independent navigation recommendations.

## Validation

- Browser automation: all four selections, response links, both endpoint rows, geometry visibility, opacity, fit/overview, keyboard and button panning/zoom, 390 px layout and no external requests or uncaught errors. Configured with reduced motion; this is not a full accessibility audit.
- Visually inspected all four map captures, the overview and the narrow review. No claim of physical walking verification or screen-reader testing.
- Four focused geometry tests plus the existing suite: **27 passing tests**. Longitude order, y-axis conversion, malformed/oversized geometry, endpoint units and out-of-bounds preservation covered.
- Lint, TypeScript and production build passed. The first sandboxed build could not reach Google Fonts; the network-enabled retry passed with 58 static pages and the existing 95 untranslated-field notices.
- SPEC, artwork, calibration, canonical point YAML and package/lock files remain unchanged. See [the plan](../plans/2026-11-09-map-routing-prototype.md) for the final verification record.
