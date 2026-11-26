# Selected map location card

Continue the local `feat/map-v2` work using `web final-18.svg` as the card source.
The user requests a card on the map's right side, above the legend, when a location
is selected. Keep the established per-theme pins, colors and map-edge limits.
SPEC Part 3 leaves map interactions to the map owner; SPEC remains unchanged.

## Implementation

- Extract the original frame, photo mask/rules, close control and badge with a
  source-hash-checked script. Keep raw Illustrator exports outside the repo.
- Supply canonical photo/headline content through the existing server page.
- Keep the sidebar list visible and render one selected card above the legend.
  Reuse its layout for TASTE/CRAFT and both languages.
- Restore focus on close, support existing destination links, and keep selected
  pins clear of the card without allowing the map past its edges.
- Use Google Maps for the card's route link from the configured origin. This does
  not add an in-app route, geographic calibration, transport mode or travel estimate.
- Compare the rendered card with the source and check all twelve locations,
  languages, narrow layouts, image failure and map-bound regressions.

## Result

Implemented and verified. The external photos referenced by the SVG were not
provided, so existing canonical photos are used; records without a real photo
show the localized unavailable state. See the latest section of `design-qa.md`
and `research/design/evidence/map-card/` for evidence and validation limits.
No commit, push, deployment, package or SPEC changes.

## November 24: match the authored photograph framing

The owner requested that card photos use the source SVG/PDF alignment. The
current `cover.jpg` assets were cropped for Explore, so another centered cover
crop in the map lost the original composition. The earlier D01-only scale tweak
also used that cropped input and could not restore the missing image area.

Recovered the uncropped, already optimized photographs from commit `0c41140`
into each point's `map-original.jpg`. Existing `cover.jpg` and `detail.jpg` stay
intact. `data/points/place.yaml` now has a separate optional `mapPhoto` per point,
including localized alt text and a measured `frame`. Content loading validates
the file and finite, positive frame dimensions. The map prefers this asset;
points without one retain the existing photo/unavailable behavior.

Source: `web final-18.svg`, SHA-256
`21a164a06273320dc6348abbcf1872e923d02f1926d35fa5b9cfd458460d8c33`.
Read every image transform and its outer clipping window directly from that SVG.
For the source image matrix `(a, 0, 0, d, e, f)` and clipping bounds
`(cx, cy, cw, ch)`, the normalized frame is:

```text
x = (e - cx) / cw
y = (f - cy) / ch
width  = imageWidth  * a / cw
height = imageHeight * d / ch
```

These are fractions of the photograph window, not CSS object-position values.
The positioned wrapper scales with that window. Its Next image fills the wrapper
using `contain`, equivalent to the source image's default `xMidYMid meet`; the
existing extracted ornamental mask clips the result. Next `fill` must remain
100% inside that wrapper: changing the image's own width/height violates its
runtime contract. Removed the earlier D01 approximation.

The SVG's five linked raster exports are still missing. For visual comparison,
the supplied SVG was rendered with only those hrefs rebound to the recovered
full photographs. The original SVG geometry was retained. This verifies the
authored placement with the available images; it does not establish identical
pixel/color data to the missing Illustrator raster exports. The local `WEB.pdf`
predates this card artboard. No generated or unrelated replacement photos were
used. Code badges, headings and the existing responsive text layout were outside
this photo-only change.

Validation: 40 browser photo cases (all five points, VI/EN, widths 1920, 1490,
390 and 320; height 1080; reduced motion) check normalized frame measurements
within 0.001, loaded images and no page errors. Four normal-motion sequences
(VI/EN at 1490 and 390) verify rapid selection, image-failure fallback, recovery
on reselect and close/focus restoration. Separate DPR-2 desktop captures were
compared against the source render. Lint, TypeScript, 86 tests, changed-source
formatting and production build pass. Existing English fallback notices remain.

Evidence: `research/design/evidence/map-responsive/card-photos/`; photo-only QA
is appended to `design-qa.md`. Prior local work and SPEC are preserved. No
commit, push or dependency/lockfile edits in this follow-up.
