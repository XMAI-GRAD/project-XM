# Saved directions and geographic context

The owner requested completion and a commit on 16 November. This supersedes the earlier no-commit constraint, but does not authorize pushing. Preserve SPEC byte-for-byte (SHA256 5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6), the artwork, calibration and canonical places. Continue the existing feature branch and preserve/include the preceding map research work.

## Implementation

1. Promote the four sourced walking samples and curated source road/landmark context into validated YAML read exclusively through src/content. Keep geographic positions separate from projected pixels. Reject stale endpoints, malformed geometry, duplicate pairs, unsafe provenance and excessive snapping gaps.
2. Add a bilingual directions mode to the actual map: choose any canonical start/destination, choose a saved pair, swap, clear, fit the route, summary and source/review details. Unavailable and same-place pairs never reuse a previous route or invent a reverse path. Context names use the supplied art and existing transform; no live service/key.
3. Show route endpoints independently of category/search pins. Preserve layer browsing and card behavior; route fitting, names and attribution remain available on narrow screens and keyboard. Labels avoid pins/cards and collisions. Disable automatic camera motion and support map image retry.
4. Verify both locales, retained locale DOM IDs, route choices/unavailable pairs, stale geometry clearing, all route vertices/endpoints, controls, labels, responsive layouts, reduced motion and supported touch/failure cases. Run formatting, lint, types, tests and production build, inspect the diff, then commit the complete map work. No push.

## Coverage and limits

The four archived FOSSGIS/OSRM paths are a saved catalogue, not every possible pair. The operator's policy (checked 16 November, https://routing.openstreetmap.de/about.html) forbids scraping/heavy use; no bulk request matrix is generated. Existing snapshots have no maneuver steps. Show walking estimates and route geometry, not fabricated turn instructions. Source points marked representative remain representative. Physical walking/access certification cannot be supplied by a browser check; make approximate/saved status explicit.

## Results

Implemented the complete saved-route interface and central context layer on both public map pages. Data now lives in `data/map-routes.yaml` and `data/map-context.yaml`, loaded/validated by `src/content`. Added start/destination selection, saved presets, exact-direction lookup, swap, clear/focus restoration, distance/time/source/access notes, fit and A/B path endpoints. Place-detail directions now open the in-app planner. Query state keeps shared/reloaded links and retained Next.js pages consistent. Native proper names are preserved; all new UI and the maps-page introductions have VI/EN text.

Preserved artwork, calibration, point records, package manifest and lockfile. Added no live provider or API-key dependency. Context covers the reviewed central area; route coverage is the four archived directed paths, with explicit unavailable states elsewhere. The public FOSSGIS service was not scraped for all 132 pairs.

## Validation

- 35 tests passed: 32 application tests and three research clipping tests. Added meaningful coverage of stale endpoints, invalid geometry/provenance, excessive snapping, directional lookup and label collisions.
- Lint, TypeScript and production build passed (58 static pages; 89 untranslated content fields elsewhere retain the existing fallback).
- Both locales, five language switches, every saved route, reversed/same/unsupported pairs, stale-line clearing, clear/card focus, unique IDs, accessible names, source links, keyboard/button pan, fit, 768/390/320 px layouts and image failure/retry passed the new browser suite. No external requests or page errors in that suite.
- Existing map regressions passed: all categories, search normalization/recovery, retained DOM ownership, card focus/pin avoidance, drag/locate/reset/zoom limits, Back restoration, reduced motion, cover failure, failed/successful map retry, and synthetic touch drag/pinch. Updated the old test's obsolete “Ngũ Xã” English expectation to the current canonical “Ngu Xa”; no application content was changed to satisfy it.
- Screenshots inspected at desktop and narrow widths. Tests initially assumed “Zoom in” must be enabled after loading a route; corrected the readiness assertion to use reset because a fitted short route can legitimately reach maximum zoom.
- Existing full-repository `format:check` reports CRLF/LF differences in untouched files, including SPEC. The full check with `--end-of-line auto` passes. Changed files use the default formatter; no mass line-ending rewrite.
- No physical walking, actual screen reader or physical touch-device test. This remains sourced approximate saved routing, without live access/closure updates or turn instructions.

Additional navigation checks passed: a shared saved pair survives reload, and a detail-page directions link correctly reopens a retained Map instance with the requested destination. Final production build and all 35 tests were rerun after the URL-state refinement and passed.

Final integrity check confirms SPEC SHA-256 `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`, artwork SHA-256 `2ebf7ebdcbf7cc5893fdb1b35ae4696d7b32fa8a8551b805231521f6820f627a`, and no changes to calibration, canonical point data or package files. Work is prepared for the requested local commit, including the preceding research/prototypes. No push.

See [integration handoff](../map-routing/INTEGRATION.md) and `docs/map-routing/integration-verification/`. The resulting commit is recorded in Git history and the final response.
