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
