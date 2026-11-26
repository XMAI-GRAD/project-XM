# Floating rail brand

The owner requested a checkpoint commit of the existing header collapse, followed
by a new sequence: collapse the header logo, move it left into the supplied pale
rail mark, keep it floating while browsing, and return to the full header when
clicked without replaying the opening. Checkpoint: `2111b7e`.

## Implementation

- Reuse the extracted header and rail SVGs. Pair the original three roof paths;
  read target geometry, fill and stroke from `RailMark`, not a duplicated asset.
- Keep the earlier opening sequence unchanged. After it finishes, use native
  scroll progress for the collapse/travel/morph, and compensate scroll on the
  original home link so it travels horizontally to the rail's x position and
  floats at the header logo's original screen height. No diagonal movement.
- Hold the header, main content and original frame together until the logo reaches
  the rail, then let the composition scroll away. Reserve the hold distance in
  the board height so the footer is not clipped. Keep one interactive brand during travel;
  hide the decorative rail copy only while this enhancement is active.
- Return to the natural document position of the header, animate with GSAP when
  motion is allowed, focus the header after arrival, and cancel on user input.
- Reduced motion switches directly between full and rail states. No JavaScript
  retains usable header and rail anchors. Scope cleanup to the current locale.
- Preserve source sizes/colors, add localized return-label text, and keep SPEC
  byte-for-byte unchanged under the owner's deferred reconciliation instruction.

## Results — 17 November 2026

- The header stays at viewport top during `max(280px, 2 * header height)` after the opening;
  the first 22% collapses the wordmark; the remaining progress moves/morphs it to
  the rail horizontally. Rail dimensions and x position come from its SVG;
  the floating y position stays at the header logo's height, per owner correction.
  Only subsequent scrolling moves the header away. The logo's scroll compensation
  subtracts the held-header translation, so its screen height remains constant.
- The floating control uses the original header anchor. The flight SVG is a
  temporary clone; the settled state uses complementary clips on the colored
  flight and exact pale `RailMark` clone, following the real rail boundary.
  Original paths remain untouched so the opening can always read clean geometry.
- Return takes 0.85s with GSAP ScrollToPlugin. Wheel, touch, key and resize input
  cancel it. Arrival focuses the header and rounds a fractional scroll target up
  so the opening cannot remain partially visible. No history entry is added.
- Reduced motion jumps between states and returns instantly. No JavaScript
  preserves native header and rail anchors. Both languages have return labels.
- Before the frame correction, six main rail browser groups, three extra touch/end-of-page/navigation groups
  and one fractional-height case pass. The 24 existing opening/lifecycle/touch/
  integration groups also pass: 34 browser check groups/cases in total.
- Viewports include 1920x1080, 1440x900, 390x844, 320x700; opening checks additionally
  cover 2560x1440. Fractional opening height checked at 1441x400 (405.28125px).
- Personally inspected intermediate travel, the full docked page and a combined
  source/implementation rail crop. Fixed an initial P2 where the navigation tab
  covered part of the moving symbol by raising the logo above header controls.
- Rail path/fill/stroke attributes match the extracted original. Position error
  is below 0.1px in the four main viewports. The artwork-only rail raster comparison
  has mean channel error 0.60/255; small edge rasterization differences remain.
  Opening/header endpoint comparisons are pixel-identical at all four tested sizes.
- Lint, TypeScript, all 38 tests and production build pass (61 pages; 110 existing
  English content fallbacks). Changed-file formatting and diff whitespace checked.
  Windows tests use explicit filename enumeration for the existing quoted-glob issue.
- SPEC SHA256 remains
  `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
  Source SVG files, generated art, package and lockfile are unchanged.

See [research and visual evidence](../../research/design/2026-11-17-floating-rail-brand.md).

## Limits

The in-app browser reports its access host unavailable; checks used local production
Edge via the existing verification setup. No captured JavaScript page errors.
Physical devices, Safari/Firefox, screen-reader audio and performance across hardware
remain unverified. Narrow tests verify animation geometry, not mobile redesign.
External route data requests were blocked by sandbox network access (`EACCES`);
navigation and Leaflet mounting were verified, not external/authenticated data flows.

The new rail interaction is not included in the earlier checkpoint commit.

## Direction correction

The owner clarified that the logo must travel left only. Removed vertical
interpolation toward the source rail mark's y position. Vertical translation now
only cancels document scrolling; at 1920px width the link stays at y=45.73px during
travel and docking. The updated browser checks sample its y at every travel stage
and during deep scrolling. Current sequence/page captures supersede the diagonal
version; the earlier normalized crop remains an artwork comparison only.

The owner also clarified that the header must stay until docking finishes. Holding
only the header caused the hero to slide underneath it and cut off its rounded
frame; the artificial lime panel also detached visually from the original rail.

## Frame correction

The header, main content and original frame now share the same scroll compensation
until docking. The source artboard remains 5400 units tall; a separate CSS hold
allowance reserves the extra scroll distance. Removed the synthetic header
background and lime panel. The logo keeps its source colors over paper and uses
complementary clips to reveal the pale mark exactly where the original rail moves
behind it. Horizontal travel and return-to-header behavior remain unchanged.
The weather/date briefly fades while the logo crosses its slot and restores once
the symbol clears it; the frame checks verify both resting states and the crossing.

At 1920px width, header/hero/frame y positions stay 0/258/180 through the 516px
docking range, then all release together. The logo stays at y=45.72 throughout.
Personally inspected docking, release and the 2477x673 viewport from the owner's
screenshot; the rounded frame and hero composition remain intact.

For this correction, 26 browser groups passed: four new frame checks, six rail,
five opening sequence, four lifecycle/touch, four integration, and three extra
touch/page-bottom/navigation groups. No captured JavaScript page errors. Production
build including TypeScript and targeted lint passed. The earlier 38-test and
pixel-comparison results above are historical, not rerun for this correction.
See the [before/after comparison](../../research/design/evidence/floating-rail-brand/frame-fix-comparison.png)
and [frame measurements](../../research/design/evidence/floating-rail-brand/frame-results.json).
