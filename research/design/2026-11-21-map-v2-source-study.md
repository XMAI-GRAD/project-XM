# Map v2: supplied SVG and fixed university origin

## Scope and sources

The owner requested review of the new UI before implementation. Routing is now
one permanent university origin to each of the 12 destination pins. Transport
mode remains undecided; the existing four saved routes are walking samples.

- Design: `D:/XMAI GRAD/workspace/File/SVG/web final-12.svg`.
- Source SHA-256: `e3336e70d76534ac6c1eaad8b4e33409cd2b39fc140484c7b4057738919b02f1`.
- Illustrator export: viewBox `0 0 1919.1 1672.5`, 502,833 bytes.
- University reference: the owner's Google Maps place link labelled
  **Đại Học Kiến Trúc - Trần Phú (Hà Đông)**,
  place identifier `0x3135acce612c766f:0xf1fff967689168e`.
- The URL's place coordinates are latitude **20.981012**, longitude
  **105.7892685** (`!3d` / `!4d`). Its `@...105.7866936` longitude describes
  the viewport, not the place pin. The web reader could not open the Maps page;
  these are decoded user-supplied coordinates, not a visually verified entrance.

## Accepted visual inspection

Rendered the original SVG using the project's Sharp/librsvg dependency, preserving
CSS, clipping and hidden elements. Inspected the whole composition, sidebar and
legend. Local inspection PNGs are in `D:/XMAI GRAD/tmp/map-v2-design/`:
`web-final-12.png`, `map-ui-detail.png`, `sidebar.png`, `legend.png`.
This is a static source inspection, not a browser interaction/accessibility audit.

The source contains 741 paths, 226 groups, no raster image elements and no live
text elements. Text is outlined. The map is actual vector artwork inside this
file; it is not the existing `public/maps/hanoi-map.png` embedded in a new frame.
Many stylesheet declarations are unused. Inspect used classes before adding
tokens. Respect `display:none`, clipping and opacity when extracting artwork.

## Composition to preserve

- Cream header: weather/date left, brand centered, ornamental search outline right.
- Cyan navigation at approximately y=180–258, with BẢN ĐỒ highlighted.
- Lavender surround and a large cream panel with shaped/rounded corners,
  approximately x=180–1740 at the source desktop size.
- Large outlined heading at the upper left: “BẢN ĐỒ BA MẠCH CỦA / THÀNH PHỐ /
  HÀ NỘI”; coloured type, custom architectural accents, purple rule and lead right.
- Explorer frame approximately x=221–1701, y=600–1301. Roughly 375 units of
  sidebar and 1100 units of map width; these are measured overview proportions,
  not final extraction bounds.
- Sidebar: BA LỚP KHÁM PHÁ, shaped search field, current-layer search hint,
  three shaped ĐỊA/VỊ/NGHỀ controls, result count, layer description and place rows.
- Map: pale roads, cyan water, coloured thematic paths, branded destination
  symbols, compass, ring-road lines and a bottom-right legend/scale.
- Preserve the original decorative shapes. Use semantic HTML for the actual
  input, category buttons, list and interactive controls, with source artwork
  extracted into separate reusable assets.

Visible source colours include paper `#FFF8F5`, surround `#E6CDFF`, frame
`#7484C4`, road `#E4CFC5`, water `#CDF4FF`, map paper `#FFF6F1`, and familiar
navy/lime/gold/red/teal accents. Several near-shades also occur (`#27398F`,
`#C48DFF`, `#FFAF26`, `#BFD100`). Preserve them locally where used; do not
normalize them into old tokens or change the site's global palette implicitly.

## Content and interaction decisions

1. Count says 05 but only D01–D04 are drawn. All five PLACE records must be
   reachable in the real list; use its existing height with scrolling if needed.
2. D04 repeats “19C Hoàng Diệu” in the design. Canonical data says
   “Hàng Đào – Đồng Xuân”; render content through `src/content`, not outlined
   placeholder copy. D05 is Cầu Long Biên.
3. The legend labels the full-colour brand marker as the coordination centre,
   not the university. Do not silently identify it as the fixed origin without
   checking its intended relationship to the supplied university point.
4. The second scale is labelled “1m” / “2m”. It is not a verified geographic scale.
   Any functional scale must follow the calibrated map and zoom, with correct units.
5. The design shows an overview, not a selected-place/route state or map controls.
   Proposed behavior: choose a layer, search/select a place, display one route from
   the fixed university origin and that destination's details; clear restores
   browsing. Keep the route summary within the sidebar rather than adding a
   separate start/end planner.
6. Existing coloured thematic paths are not verified university-origin routes.
   Separate them from base roads and the new navigation overlay during extraction.
7. Keep road names/landmarks as a separately controllable label layer. Their
   coverage and placement must be reviewed against the new artwork.

## Geographic implications and implementation order

The current transform projects the supplied origin to about **(486.28, 883.21)**
on the old **1618 × 1020** PNG, inside its bounds. This is a numerical coverage
check only, not evidence of entrance access or alignment on the new SVG.

1. Extract the new frame, heading, map base, symbols, thematic lines, compass and
   legend separately. Preserve the existing shared header and cursor behavior.
2. Match the static desktop composition and source spacing, then wire the
   sidebar/category/search/pin selection to canonical data.
3. Establish a transform for the new map from geographically identified controls
   and independent checkpoints. Compare against the old calibration only as a
   reference; do not reuse its pixel values unverified.
4. Add a separate fixed routing-origin record in map configuration. Do not change
   `map-calibration.yaml`'s mathematical `origin` to mean a trip origin. Do not add
   the university as a thirteenth cultural destination.
5. After mode and start access are established, source and review 12 outbound
   routes under a provider's storage/use terms. Test a central and an outer path
   before sourcing the rest. Store geographic geometry/provenance, project it at
   load time, and validate coverage and endpoint gaps.
6. Simplify route state to the selected destination; preserve `?to=slug` links,
   remove origin selection/swap/pair presets and handle old `from` parameters.
7. Verify visual fidelity, every destination, locale/history/focus behavior,
   keyboard/zoom/fit controls, reduced motion and map failure recovery.

The initial source review made no application or SPEC edits. The owner then
authorized the interface implementation; results follow.

## Implementation notes for future work

- `scripts/map-art/extract.py` verifies the source SHA before extracting 20 SVG
  assets and `data/map-design.yaml`. Run it with the original SVG path, then format
  the manifest with Prettier. Raw source stays outside the repository.
- Sharp/librsvg is the reference renderer. PyMuPDF did not correctly interpret
  Illustrator CSS, hidden groups and clipping during initial inspection; its
  early renders are not accepted evidence.
- The frame path is a filled silhouette, not just an outline. It belongs behind
  the sidebar/map. Exact inner masks come from source paths 13/14/18 and
  12/1/0/0/0. Applying another 50% CSS opacity to the sidebar ornament incorrectly
  quarters its source opacity. Leaflet's global image/interactive styles also
  need scoped specificity for pin sizing and hit targets.
- Source symbol centres are stored relative to crop x597/y610, 1094 × 680. They
  are authored visual positions, not outputs of the old geographic transform.
  Map-base currently preserves thematic paths together with the illustrated roads;
  split/identify their source groups before introducing a navigation overlay.
- The fixed university origin record is separate from the 12 destinations and
  from the mathematical projection origin. It is not yet pinned on the new SVG.
- Desktop follows the source layout; mobile has a stacked adaptation. Selection
  replaces the list within the sidebar. There is no start selector, swap action,
  pair preset, fabricated distance or new route on this interface.
- Dense symbols must not inherit Leaflet's rectangular invisible hit boxes over
  neighbouring pins. The artwork receives pointer hits; semantic buttons retain
  keyboard focus. The list is the full-size alternative, and zoom separates pins.
- Use instance-scoped `useId` references and locale-specific main IDs: Next may
  retain hidden pages after language navigation. Repeated VI/EN switches passed.
- Visual comparison and browser checks, including emulated pinch/pan, are recorded
  in root `design-qa.md`, the implementation plan and `research/design/evidence/map-v2/`.
  Physical devices, other browser engines and screen readers remain untested.
- SPEC stayed byte-for-byte unchanged. Existing package/lockfile upgrade is intact.
