# Saved directions in the product map

Implemented 16 November 2026. Open `/vi/maps` or `/en/maps`, then **Lộ trình đi bộ / Walking routes**. The comparison prototypes remain useful research tools; the visitor interface now renders saved paths directly on the original artwork.

## Shipped behavior

- Four explicitly directed walking paths: Hoàng thành → Văn Miếu, Bún thang Bà Đức → Ngọc Sơn, Văn Miếu → Vạn Phúc, and Phố cổ → Cầu Long Biên.
- Choose any of the 12 canonical places, swap endpoints, select an available path, clear, or fit the route. A missing/reversed/same-place pair never retains the previous line or invents a reverse route. No live routing request or API key.
- Distance, estimated walking time, source date/link, endpoint notes and approximate-access guidance. These samples have no maneuver steps. A/B marks the saved geometry endpoints; snapping gaps are not drawn as invented walkable connections.
- Nine source road names and three source landmarks around Hoàng thành–Văn Miếu, shown as space and zoom permit. Source road lines remain hidden. Names use native proper names in both locales; interface labels and page introductions are bilingual. Coverage is explicitly described as selected central-area context, not city-wide street labeling.
- Names avoid other labels, displaced place pins, route endpoints and the detail card. All camera operations are immediate. Button panning complements dragging/keyboard controls.
- Place cards and detail-page directions open the in-app planner. URL query `view=routes&from=<slug>&to=<slug>` stores the chosen pair; `?to=<slug>` preselects a destination. Unknown query slugs are ignored against the supplied canonical places. No user query fetches a server resource. Native History API updates preserve sharing/reload and avoid stale local selection in retained Next.js pages.
- “Show entire route” also brings the map into view and focuses it. Clear restores focus to the starting-place selector. Unique instance IDs preserve correct labels/ARIA references across retained VI/EN routes. Retry preserves the chosen route after image failure.

## Data and maintenance

`data/map-routes.yaml` holds geographic geometry, endpoint slugs and frozen coordinates, source/hash/date/review metadata and provider estimates. `data/map-context.yaml` holds geographic label anchors/tangents, source-tile references and names. The production loader is exclusively `src/content/index.ts`, using pure validators in `src/features/maps/catalogue.ts` and the existing projection helper.

The build rejects duplicate/same-place pairs, unknown or changed endpoints, malformed geometry, routes outside the artwork, snapping gaps over 30 m, invalid dates/metrics/source URLs and incomplete context provenance. The 30 m threshold is an acceptance ceiling for this catalogue, not a claimed positional accuracy. All four current routes have gaps under 19 m. Raw samples and vector tiles remain archived in the research folders. `promote-samples.mjs` deterministically promotes the four archived samples and saved label proof to YAML; no fetch occurs.

To add coverage, obtain a walking route from a provider permitting the intended use, save dated raw evidence, review endpoint access and image correspondence, then extend the promotion source list and regenerate. The review status `geometry-checked` never means walked in person. Return paths require their own source evidence. Update authoring tests/coverage counts deliberately. Do not batch-scrape the FOSSGIS public service; its [usage policy](https://routing.openstreetmap.de/about.html) forbids scraping/heavy usage.

Data attribution appears on the map: OpenStreetMap, OpenFreeMap/OpenMapTiles, OSRM/FOSSGIS, with an OSM correction link. The frontend uses the existing Leaflet dependency. No new application dependency or lockfile change.

## Verification

See [the implementation plan](../plans/2026-11-16-map-directions.md) and `integration-verification/` for current screenshots and browser reports. Both locales and every saved path were exercised. Unsupported pairs, stale-line clearing, selection/focus, names, locale DOM ownership, desktop/narrow layouts, keyboard/button controls, reduced motion, image retry, cover failure and emulated touch/pinch passed. Physical walking, real touch hardware and an actual screen reader remain unverified.

Thirty-five tests pass (32 application tests and three research clipping tests). Lint, TypeScript and production build pass; 58 static pages, with 89 pre-existing untranslated content fields falling back to Vietnamese. The repository's default Prettier check reports existing CRLF/LF differences, including SPEC; the full check with `--end-of-line auto` passes, and changed files pass the default formatter. SPEC remains byte-for-byte unchanged. The artwork, calibration and canonical point YAML are also unchanged.

The four saved paths are the current data coverage. A full 132-direction catalogue, live routing, current closures/traffic, turn instructions, city-wide street context and verified public access are not shipped features. They require additional data/provider/access work, rather than more invented geometry or interface placeholders.
