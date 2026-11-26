# Geographic source → hand-drawn Hanoi: an inspectable proof

**16 November:** this standalone comparison remains available, and its curated labels have now been integrated into the actual Map page alongside four saved routes. See [the current product integration](../map-routing/INTEGRATION.md). The observations below describe the original 9 November proof.

Built and researched personally on 9 November 2026. No sub-agents. This is a local research preview, separate from `/vi/maps` and `/en/maps`.

## Open and compare

From the repository, run:

```powershell
node docs/map-labels/serve-review.mjs
```

Open **http://127.0.0.1:4319**. The current task left that server running.

1. The left view is the original PNG with the existing calibration; the right view renders saved source geometry in geographic Web Mercator coordinates.
2. Toggle **Source roads on drawing**. Teal roads and the selected red road disappear, exposing the unchanged drawing. Toggle the route/names too for an unobstructed comparison.
3. Select Hoàng Diệu, Nguyễn Thái Học, Văn Miếu or Quốc Tử Giám. Inspect the source coordinates, derived image coordinates and raw tile reference below.
4. Zoom in to inspect offsets and reveal more labels. Selecting a short road zooms closer if its name is obscured at overview scale. Both views pan independently; **Reset both views** restores the same geographic area.

Screenshots are in `screenshots/`. `verification.json` records the browser checks. All browser assets are local; the viewer makes no tile, route or font requests. External evidence links open only when followed.

## Actual source and provenance

The reference consists of **two OpenFreeMap vector tiles**, using the OpenMapTiles schema and OpenStreetMap-derived data. It is real geographic source data, not an invented illustration, a Google Maps screenshot or a government survey. The right-hand view is our rendering of that data, not the official OSM map style.

- Metadata: <https://tiles.openfreemap.org/planet>.
- Archived source snapshot: `20261101_080013_pt`, zoom 14, tiles `13008/7212` and `13009/7212`.
- Downloaded tile bytes: **1,155,096**. Source URLs, retrieval time, exact hashes and metadata are in `source-tiles/manifest.json`; the two original PBF files are preserved unchanged.
- Extract bounds `[west, south, east, north]`: `[105.8305, 21.0245, 105.8445, 21.0375]`.
- Nine road names copied verbatim from `transportation_name`; three landmarks from `poi`, selected by both name and class. The citadel `castle` point is deliberately distinguished from a nearby `shop` with the same name.
- 1,465 clipped transportation line pieces form the reference context. These include minor paths and tile-buffer overlap; this is **not** a count of unique roads.
- Raw tile layer/index references are reproducible extraction identifiers. **They are not OSM way/node IDs.** The geographic OSM link provides context, not an asserted identity link for a source feature.
- A/B entrances come from the validated canonical dataset, including its actual OSM node references. They are separate from the additional landmark points.
- The single 968.3 m walking route reuses `../map-routing/samples/central.json` from FOSSGIS/OSRM (81 vertices). No new routing request was made. This response has no maneuver steps; nearby road labels must not be presented as provider turn instructions.

Direct Overpass acquisition failed: the main server returned 502 (one response explicitly reported capacity exhaustion); the private.coffee and maps.mail.ru mirrors timed out. The fallback uses an archived vector-tile snapshot rather than pretending a fresh raw OSM extract succeeded. Tile geometry is already clipped, quantized and potentially generalized; it is not survey precision or unprocessed OSM geometry.

OpenFreeMap's [quick start](https://openfreemap.org/quick_start/) and [terms](https://openfreemap.org/tos/) permit limited offline downloads, currently up to 3,000 tiles or 50 MB, at most four concurrent downloads, with an identifying user agent. This acquisition fetched two tiles sequentially with a project-specific user agent. Recheck terms before expanding or refreshing. Attribution appears in both maps and the footer: OpenFreeMap, © OpenMapTiles, data from © OpenStreetMap contributors. OSM-derived data remains subject to [ODbL attribution and applicable share-alike requirements](https://www.openstreetmap.org/copyright).

## How the mapping works

```text
source longitude/latitude
  → Web Mercator metres relative to our calibration origin
  → existing affine transform, unchanged
  → image x/y in the original 1618 × 1020 drawing
  → Leaflet CRS.Simple [imageHeight − y, x]
```

`build-review.mjs` calls the existing `projectToArtwork` implementation and loads calibration and canonical places through `src/content/`. The reference map uses longitude/latitude directly in Leaflet's standard geographic CRS, without the artwork fit. No new control point, warp, road offset or guessed pixel anchor was introduced.

Road label candidates lie along the longest contiguous cropped source line (halfway, then quarter positions and additional positions). Screen-space collision tests choose a readable candidate as the view changes. Text rotates with the local source tangent. Text offsets do not change road geometry. The evidence panel reports a stable source midpoint, not whichever display candidate currently wins. Some labels hide at smaller scales; all features remain selectable. This is not a finished city-wide labeling engine.

Line clipping preserves disconnected pieces; it must never bridge an out-of-bounds detour with a fictitious straight segment. Three geometry tests cover that behavior.

## What we observed

The major road network closely follows the drawing at overview and closer inspection: Hoàng Diệu, Nguyễn Thái Học, Văn Miếu, Quốc Tử Giám, Chu Văn An and surrounding junctions provide recognizable correspondences. **Sourced names and a saved route can be placed on this particular drawing using its existing georeference.**

Local offsets remain; fine paths and site detail in the source are absent or simplified in the drawing. The raster becomes blurred at individual-street scale. The data overlay supplies geographic detail; enlarging the PNG does not.

This is a visual feasibility result, not a new accuracy measurement. The existing calibration's four independent check points had RMS ~1.64 px / maximum ~2.13 px; those values apply only at those checks, not every road or route. The fit and source both ultimately use OSM geography, so this is not independent ground-truth validation. No new survey, route-wide error bound, on-foot access check or current operational verification was performed. An arbitrarily distorted illustration could require more control points or another georeferencing method; this does not establish that every hand-drawn map can use one affine fit.

## Reproduce offline

Normal preview regeneration uses the existing project installation and saved reference:

```powershell
node --conditions=react-server --experimental-strip-types docs/map-labels/build-review.mjs
node --test docs/map-labels/reference-geometry.test.mjs
node docs/map-labels/serve-review.mjs
```

To re-extract the raw PBFs, install temporary tooling outside the repository's package manifest:

```powershell
npm.cmd install --prefix "D:\XMAI GRAD\tmp\map-reference-tools" --no-save --package-lock=false --ignore-scripts @mapbox/vector-tile@3.0.0 pbf@5.1.2
node docs/map-labels/prepare-reference.mjs "D:\XMAI GRAD\tmp\map-reference-tools"
node --conditions=react-server --experimental-strip-types docs/map-labels/build-review.mjs
```

`prepare-reference.mjs` verifies tile hashes before decoding. It uses `VectorTile(new PbfReader(bytes))` and `toGeoJSON(x, y, z)`, following the [Mapbox decoder](https://github.com/mapbox/vector-tile-js). No MapLibre or new application dependency is required; the preview uses the existing [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html).

`fetch-tiles.mjs` is an explicit acquisition script, not a build step. It refuses to replace an existing manifest. Archive/review deliberately before refreshing; opening the page never triggers a refetch.

## Validation and remaining work

Isolated Edge checks passed at 1500 px and 390 px: feature selection, source references/raw links, overlay/name/route toggles, opacity, panning, keyboard zoom/pan, reset, no overlapping visible labels at the checked desktop view, no horizontal overflow, no runtime external requests and no page errors. Screenshots were visually inspected. The browser was configured for reduced motion; the preview disables camera animation. Physical touch, an actual screen reader and a full accessibility audit were not tested here.

The prototype is outside the public frontend. No product map behavior, package manifest, lockfile, canonical point, calibration, artwork or SPEC change is needed to inspect it. Next: a curated label layer plus a limited, reviewed saved-route dataset, bilingual UI, route-aware priority and honest unavailable-route states. Do not silently expand this proof into 132 routes or introduce a live API requirement.

Final validation: 30 tests passed (27 application tests plus three clipping tests), TypeScript, lint and changed-file formatting passed, and offline extraction/projection reproduced identical hashes. SPEC and artwork hashes match the start of this task. A production application build was not repeated for this standalone research-only change; the earlier passing build is documented in the preceding route task.
