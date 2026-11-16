# Sourced road names and landmark proof

## Goal

Demonstrate a small Hoàng thành–Văn Miếu area with one saved walking route, actual OSM road geometry/names and a few sourced landmarks. The owner is specifically skeptical that a real source map can be mapped onto the supplied drawing. Make provenance, the transformation and mismatches inspectable.

Preserve all pre-existing uncommitted route-prototype work. Keep SPEC.md, the artwork, calibration and canonical point content unchanged. SPEC starts at SHA-256 `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`. No commit/push. No sub-agents.

## Approach

1. Obtain bounded source geometry/names. Overpass failed with a 502 capacity response and mirror timeouts, so use two archived OpenFreeMap/OpenMapTiles vector tiles derived from OSM. Preserve raw tiles, metadata, hashes and tile/layer/index references; do not mislabel them as OSM object IDs.
2. Use the existing fixed calibration without refitting it to make this demonstration look better. Display an independent geographic source view alongside the drawing, with a switchable projected-road overlay.
3. Attach road labels to real source geometry, with zoom/collision rules. Landmark names/positions have visible source links. A route and its names remain separate from unsupported walking-access claims.
4. Test label legibility and source/artwork correspondence at desktop/narrow sizes. Record observed mismatches, source limitations and unchanged files.

This is a local proof before expanding labels across the product. OSM is community-maintained geographic data, not a government survey. Readable names do not make missing drawing detail or entrance accuracy automatically correct.

## Results

Implemented a separate comparison at http://127.0.0.1:4319, served by `docs/map-labels/serve-review.mjs`. The geographic view renders saved source geometry in normal geographic Leaflet coordinates; the drawing view reuses the fixed projection. Nine road names, three source landmarks, two canonical entrances and the prior saved central route are inspectable. Toggles, zoom/pan/reset and a source inspector are available. No app package or live service integration was added.

Major corridors visually align here. Local offsets, omitted paths and raster blur remain. No new error bound, access verification or independent survey validation is claimed. The processed vector snapshot is `20261101_080013_pt`, retrieved on 9 November. The artwork, calibration and canonical data were not adjusted to improve this result.

The first label pass hid too many names near entrance markers. Refined it to try multiple positions along the same source line, with upright rotation and collision suppression. Browser verification passed after that change: source selection/links, toggles, opacity, keyboard/button navigation, reset, collision check, desktop/narrow layouts, no external runtime requests or page errors. Screenshots were inspected. Physical touch, a screen reader and a complete accessibility audit remain outside these checks.

Selecting a short road initially still hid Quốc Tử Giám's name behind its entrance at overview scale. Fixed selection to zoom closer, without moving its source geometry. Retested every selectable feature and specifically asserted visible selected labels for the four principal route-context roads; passed.

See [evidence and reproduction instructions](../map-labels/README.md), `docs/map-labels/verification.json` and [the research handoff](../../research/map-routing/LABELS_AND_SAVED_ROUTES.md).

## Final validation

- Offline raw-PBF extraction and projection regenerate identical output hashes. Raw source hashes verify before decoding.
- 30 tests passed: 27 existing application tests and three new research clipping tests. Windows-safe explicit test-file expansion was used because the package test script's quoted glob is not expanded correctly here.
- TypeScript, lint and changed-file formatting passed. This task changed only the standalone research prototype/documents, so the production application build was not repeated; its prior passing result belongs to the preceding route-prototype task.
- Edge browser checks passed after both label refinements; desktop and 390 px screenshots were visually reviewed. Preview makes no external requests. Physical touch, actual screen reader and a complete accessibility audit remain untested.
- `git diff HEAD` is empty for SPEC, artwork, calibration, canonical points, package.json and pnpm-lock.yaml. SPEC SHA-256 remains `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`; PNG remains `2ebf7ebdcbf7cc5893fdb1b35ae4696d7b32fa8a8551b805231521f6820f627a`.
- Earlier uncommitted route-prototype work preserved. No commit, push, live route integration or public frontend change.
