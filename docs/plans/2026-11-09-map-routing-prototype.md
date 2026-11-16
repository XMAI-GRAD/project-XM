# Route service research and artwork prototype

## Scope

Research a suitable service for A-to-B routes on the owner's Hanoi drawing, then obtain a small set of real routes and inspect their alignment using the existing calibration. This is an engineering review before the public directions interface. Do not expose a demo service as a production dependency.

Starting commit: `67523e1` (`feat(map): added missing locations`); working tree clean. Preserve the artwork, calibration, canonical points and SPEC.md. Starting SPEC SHA-256: `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`. No commit or push. The owner's instruction to defer SPEC reconciliation remains in effect.

## Work

1. Read current primary documentation: custom-map display rights, attribution, quota, transport modes, coverage, credentials and service reliability. Save source-linked research in the repository so teammates can use it.
2. Fetch a few explicit pedestrian test routes from an identified public service within its usage policy. Retain dated responses for an offline, reproducible review; no background route generation.
3. Normalize and validate route geometry, transform longitude/latitude to artwork pixels, and report endpoint snapping and out-of-bounds geometry without concealing either.
4. Provide an interactive review with route selection, artwork comparison and zoomed inspection. Use the unchanged drawing and calibrated geographic anchors, never displaced UI pin positions.
5. Visually inspect central and outer-city samples. Record actual evidence and limitations, distinguishing geographic projection from usable walking access and production service verification.
6. Run relevant tests and project checks. Record the next integration contract and prerequisites.

## Completed on 9 November 2026

- Read current ORS/HeiGIT plans, terms, API migration/response documentation and status evidence; compared GraphHopper and FOSSGIS OSRM. Plans/terms required a rendered browser. Read the operator's English usage excerpt; its linked German full policy was blocked by an anti-bot page. Research and an agent handoff are saved in [research/map-routing/README.md](../../research/map-routing/README.md), inside the repository.
- Recommended ORS as the first live-service candidate, conditional on a project-owned key and actual authenticated Hanoi tests. The current new API host is documented. No key/account was created, no ORS authenticated request was made, and no service was added to the public app.
- Made four explicit, identified FOSSGIS foot-routing requests, separated by more than one second. Saved dated raw responses and request URLs. The offline builder uses the actual content/calibration loader, checks endpoints against canonical data and hashes the source files.
- Added a reusable, tested GeoJSON-to-artwork/Leaflet projection helper. It validates coordinate order/shape/size, reports geographic endpoint gaps and retains off-artwork vertices instead of silently joining/clamping the path.
- Added a local interactive Leaflet review with four sample routes, fit/overview, line visibility/opacity, zoom, pointer-button and keyboard panning, original artwork, source links and endpoint diagnostics. A loopback-only allowlist server opens it at `http://127.0.0.1:4318`; it also works as a local HTML artifact with dependencies installed. No runtime tile/API request is made by the review.
- All 648 vertices across the four samples are inside the image. Requested-pin gaps range from about 0.03 to 18.33 m. Saved measurements contain full precision; displayed distance/time use the provider's estimates.
- Visually inspected all four route captures, original-drawing comparisons, the overview and narrow layout. Broad corridor alignment is promising; local offsets and unrepresented pedestrian detail are visible. Ngọc Sơn's approach is a clear example of valid projected geometry crossing blank artwork. The review does not claim pixel-perfect tracing, route-wide accuracy or usable entrance access. Representative bridge/village pins remain explicitly identified.

## Validation

- Changed-file Prettier checks and `git diff --check` passed.
- `pnpm lint` and `pnpm typecheck` passed.
- All **27 tests** passed (23 existing plus four geometry tests). On Windows the explicit files from `rg --files src -g '*.test.ts'` were passed to Node; the existing quoted-glob package script remains untouched.
- Production build passed: 58 static pages, existing 95 untranslated-field notices. Initial sandboxed attempt could not download existing Google Fonts; the network-enabled retry succeeded without dependency or font changes.
- Local Edge/Playwright review checks passed: four selections and saved-response links, endpoint rows, visibility/opacity, fit/overview, keyboard and button panning/zoom, 390 px overflow check and reduced-motion configuration. No external requests or uncaught page errors. Screenshots in `docs/map-routing/screenshots/` are the durable visual evidence; the temporary detailed browser report is `../tmp/map-step5-qa/routing-review.json` relative to the repository.
- SPEC hash remains `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`. Artwork, calibration, all canonical content, package manifest and lockfile also have no diff from the starting commit. No commit or push.

## Remaining work

The requested research/prototype phase is complete. The full bilingual directions UI and live server adapter remain the next implementation phase. Obtain/configure a project-owned ORS key, test its current walking service in Hanoi, choose route-access points without changing editorial pins, and implement shared quota/cache handling before exposing a live endpoint. Decide how the design should explain routes over missing drawing detail. Do not distort service geometry to make it cosmetically match.

No physical walking, hardware touch, screen-reader or route-wide quantitative alignment audit was performed. No request matrix was generated. The public map pages were not functionally changed; the new pure helper is not yet imported by them. Existing earlier full-map browser results are historical evidence, not a new whole-app browser audit in this phase.
