# Map v2 interface

## Authorized scope

Implement the supplied `web final-12.svg` desktop interface on `feat/map-v2`.
Preserve the existing package.json/pnpm-lock.yaml upgrade and SPEC byte-for-byte
(SHA256 `a9e92899200b783d576cbfeee2aa08819e19579a7d020bfa2967c9e237e6c9f1`).
No commit, push or remote publication. Source reading is done by the primary agent.

The owner approved Playwright with headless Edge for visual and interaction checks.
The built-in browser host is unavailable.

## Implementation sequence

1. Extract reusable source vectors with a source-hash checked local script.
2. Move the maps page out of the old site frame into the shared showcase header.
3. Implement the exact desktop layout, canonical lists, category/search controls,
   artwork pins, selected-place details, zoom/pan/reset and keyboard interaction.
4. Preserve destination links, VI/EN switching, image retry and unique instance IDs.
5. Compare rendered output with the SVG, test interactions and run project checks.

## Explicit next stage

The new illustration uses authored pin positions for this interface pass. It is
not yet geographically calibrated. Do not reuse old pixel positions, road labels
or route geometry on it. Keep archived routing data and geometry validation intact.
The fixed origin is the supplied place pin at 20.981012, 105.7892685. Transport
mode and entrance/access validation remain outstanding before sourcing 12 routes.
Remove the arbitrary pair-planner UI; do not invent routes or travel estimates.

## Results

Interface implemented on `/vi/maps` and `/en/maps` outside the old `(site)` layout.
The shared showcase header, source frames/heading, vector map, compass and legend
replace the old map page. Twenty extracted assets and a source-hash-checked
extraction script are included. Canonical records remain in `data/points`; authored
display anchors and the fixed origin live in `data/map-design.yaml`, read only
through `src/content`. Pixel anchors are deliberately not geographic coordinates.

Search, 5/4/3 categories, all 12 pins, selected details, destination links,
keyboard controls, pan/zoom/reset, localized labels, unique instance IDs and map
image retry work. The arbitrary origin/destination pair planner is absent from
the new page. Legacy route data, calibration and unused old components remain
intact for the next routing stage; none is projected onto the new art.

Validation: approved headless Edge at 1920/1280/390 widths; repeated locale switches,
all pins/cards, accent-free search, no-results/clear, Enter/Space/Escape, restored
focus, Tab/skip link, deep-link reload, ARIA references, drag/zoom/limits/reset,
legend and failed-image retry passed. Emulated two-finger pinch and one-finger
pan passed under reduced-motion preference. No page errors. No physical device,
screen-reader or non-Chromium verification was available.

Lint, TypeScript, production build and 46 tests pass. Changed-file formatting passes.
Default full-repository formatting reports existing CRLF files; checking with
`--end-of-line auto` passes. Do not normalize unrelated files or SPEC.
Build reports the existing 109 untranslated content fields falling back to VI.

See root `design-qa.md` and `research/design/evidence/map-v2/` for source/render
comparisons, fixes and final results. The desktop source's small/light text and
uncalibrated scale artwork remain design limitations, not functional measurements.
No navigation route, travel time or verified geographic alignment is claimed.

SPEC hash remains `a9e92899200b783d576cbfeee2aa08819e19579a7d020bfa2967c9e237e6c9f1`.
Existing Next.js 16.4.6 package/lockfile changes were preserved. No commit/push.
