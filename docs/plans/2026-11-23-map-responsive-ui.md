# Map responsive UI and label boundaries

Continue the existing `feat/map-v2` work. The owner authorized implementing the
research recommendation: proportional artwork and readable responsive UI.
Latest owner decision: try anchored placements in order **above, right, left,
below**, accepting the first that fits the **full artwork bounds**. Crossing the
visible frame alone still clips naturally during dragging. Selection/focus fits
the pin and label in the visible map when possible, with the details card as the
readable fallback. This supersedes the earlier above/right-only, always-above
and abandoned frame-clamping approaches below.
Preserve the source illustration,
pin coordinates, routes, full-width composition, shared homepage and motion.
SPEC Part 3 delegates map interactions; no SPEC change is needed for this fix.

## Work

- Use ordered anchored label placements based only on true artwork bounds.
  Do not introduce frame-edge clamping, sliding labels or hover-driven camera moves.
- Let sidebar content flow and scroll with readable text and usable controls.
- Let cards wrap and grow within the available map space, docking below on narrow
  screens; preserve source assets and keyboard focus behavior.
- Verify both locales at 1920 and 2002×1122, narrower desktop, short windows,
  mobile, enlarged text, map edges, selection/close, routes and reduced motion.
- Run formatting, lint, types, browser regression checks, full tests and build.

## Results

The following entries record the earlier iterations; the last follow-up is the
current behavior. Implemented, then corrected after the owner's review. The initial collision
placement contradicted the explicit decision in
[the November 22 route plan](2026-11-22-map-origin-routes.md). It shifted labels
away from their pins near the map edge. Removed that placement helper and its
tests, measurement observers and frame scheduling. Labels again use
`left: 50%; bottom: 100%; transform: translateX(-50%)` and the existing map mask
clips overflow. Hover labels remain pointer-accessible and dismissible with
Escape; card-close focus restoration remains intact. Minimum zoom, map bounds,
artwork coordinates and routes were not changed by this correction.

The sidebar now uses normal flow and an independently scrollable list. Reading
text uses rem sizes; controls have a 2.75rem target. Source artwork still scales
with the original container unit. At container widths up to 75rem the sidebar
stacks above the map and the selected card docks below it. Cards wrap, grow and
scroll when necessary, preserving their source images and frame. The legend
moves away from an open desktop card and remains available. No homepage layout,
artwork, pin/route coordinates, dependencies or lockfile changes were made.

Two existing Windows test issues were repaired so validation is meaningful:
the package test glob now uses cross-platform double quotes (single quotes made
the Windows command discover zero tests), and the opening-morph fixture loader
passes file URLs directly to Node rather than using URL.pathname as a Windows
filesystem path. No dependency installation is needed for these script changes.

### Initial verification (before label restoration)

The label-containment assertions below and the original evidence captures
describe the superseded collision-placement implementation. Current label
behavior is verified separately in the restoration entry below.

- New label geometry regression tests: above/below placement, all edges,
  obstruction avoidance and insufficient space.
- `pnpm test`: **76 passed, 0 failed**, including the recovered opening tests.
- Lint, TypeScript, production build, changed-file formatting and `git diff
--check`: passed. Build retains the existing 109 English-field fallbacks.
- Plain repository `format:check` flags 193 untouched files with CRLF endings;
  the full check passes with `--end-of-line auto`. No mass reformat was performed.
- Headless Edge matrix: 1920×1080, **2002×1122**, 1536×740, 1280×800,
  1100×700, 1024×768, 800×700, 390×844, 320×720 and 1920×1080 with root
  text size doubled. Ngũ Xã hover/selected labels remain visible and within
  the map; no document horizontal overflow or page errors. Input text increases
  from 20 to 40px, label text from 14 to 28px, under doubled root text size.
- All 12 destinations checked in each of four locale/motion/viewport combinations
  (48 selections): label stays clear of card/edges, focus reaches the card title,
  selected icon motion persists, and keyboard pan/zoom keeps visible labels in bounds.
- Hover onto a label, Escape dismissal/re-entry, close focus restoration, four
  direct VI/EN loads, search → selection → route, and resize with an open card
  (1280, 1100, 390, 1920): passed; card actions remain reachable by scrolling.
- Visually inspected desktop hover/selection, a narrow English sidebar, narrow
  cards and enlarged-text map. Evidence is in
  [research/design/evidence/map-responsive](../../research/design/evidence/map-responsive/).

### Limits and handoff

Current shared header has no language toggle; locale checks use direct localized
URLs and do not claim an in-app locale-toggle test. Root text enlargement and
narrow reflow were tested; physical Windows scaling and real browser-toolbar
zoom were not exercised. This pass did not test physical touch/pinch, screen
readers or other browser engines, and does not establish WCAG conformance.

SPEC SHA256 remains
`7F65EEC1C2D9725DBC19C0A09D7C064020EF928209DE99340353C7980193DFE3`.
No commit or push. Local production preview: http://localhost:3000/vi/maps.

### Follow-up: source sidebar insets

The owner's comparison exposed a regression in the compact desktop rules:
replacing the heading's source `33.5 * --u` inset with `0.5rem` moved it into the
top-left curved mask. Removed those compact inset overrides for the heading,
search/help, layer copy and rows, retaining readable text sizes. Restored the
transparent row background so rows do not cut rectangular holes in the source
decoration. The local responsive changes and old Vercel design are different
builds; DevTools preview zoom further changes screenshot display scale.

Verified VI/EN at viewport widths 1230, 1280, 1490, 1536, 1920 and 2002, each
714px high with DPR 1.25 and native scrollbars. At the owner's exact settings,
content width is 1475px, heading left edge is 36.02px inside the sidebar and the
curved corner ends at 33.88px. The heading stays beyond that corner, without text
overflow; Ngũ Xã's label remains fully visible inside the map. New measurements
and VI/EN captures are in `sidebar-inset-results.json` and `sidebar-inset-*.png`
in the evidence folder. CSS formatting and production build pass.

### Follow-up: live browser zoom mismatch

Inspected the owner's open Edge window and DevTools through Computer Use on
2026-11-23. The device toolbar displayed 1490 x 714, DPR 1.25 and preview zoom
100%, but Edge's address-bar control reported page zoom **110%**. Reading the
page's actual values returned `innerWidth: 1355`, `innerHeight: 649`,
`clientWidth: 1341`, `devicePixelRatio: 1.375`. Root font size was 16px, sidebar
input 20px and row title 14px. The device toolbar dimensions alone therefore
did not establish the effective CSS viewport. Browser preferences were not
changed. This corrects the earlier assumption that the owner's screenshot and
the 1490 x 714 automated run had equivalent rendering conditions.

The clean Edge run at 1490 x 714 / DPR 1.25 has content width 1475, sidebar
height 522.48px and list height 214.81px. All three Vietnamese craft rows fit;
the final row ends 45.80px above the sidebar bottom. The place list has five
rows and scrolls (337px content in a 215px viewport). Its scroll viewport ends
16px above the sidebar bottom; a partially visible row does not by itself
establish that the decorative frame is clipping it. The compact bottom inset
is smaller than the source-scaled 45-unit inset and remains a visual review
point. No new layout changes were made during this diagnostic comparison.

Live Vercel comparison was unavailable in the clean test browser because the
deployment redirected to Vercel login. Do not claim the deployed build was
verified. Local rem typography also differs from the older proportional CSS,
so matching zoom/viewport still requires matching build, locale and category
before treating screenshots as a pixel comparison.

### Follow-up: restore intentional label clipping

The owner confirmed that a label sliding away from its pin is worse than its
intentional clipping. Restored the previously agreed behavior for both place
labels and the fixed university label. Minimum zoom already covers the map
frame; lack of space for screen-sized text near an artwork edge does not justify
detaching that text from its anchor. Any future change to map framing or extra
artwork margin is a separate design decision.

Headless Edge checks on the updated development server passed:

- VI/EN at widths 1490, 1355 and 390, each 714px high: visible labels remain
  exactly centered above their pins in hover and route views. Edge clipping is
  expected, including the Ngũ Xã label at overview. Escape dismissal and route
  clearing work, with no page errors.
- At 1280px, panning the university to 20.01px from the left edge keeps its label
  centered at 20.01px, with its left edge at -82.13px and its bottom at the pin's
  top. Visually inspected the resulting natural clipping. Opening the legend
  does not shift the label. Route interruptions, Escape during dismissal,
  reduced motion during dismissal, search and category clearing pass.
- Scoped formatting, ESLint and TypeScript pass. All **72** remaining tests pass;
  the four deleted tests belonged solely to the removed placement helper.
- Production build passes, retaining the existing English-content fallbacks.

Current evidence: `research/design/evidence/map-responsive/label-restoration/`.

### Follow-up: teammate viewport and selected-location framing

The owner asked to fix the display at the teammate's measured 1490 x 714 CSS
viewport (1475px content width, DPR 1.25). Keep the proportional, edge-to-edge
artwork and the centered-label decision. Do not pad the artwork with empty space
or move labels independently of their pins.

Added `selected-view.ts`, which finds a camera view for the complete pin and
label rectangle. Selection and keyboard focus first try the existing zoom;
they zoom closer only when the artwork edges prevent a safe pan. The candidate
camera must keep the artwork covering the full map surface and clear the card,
legend, compass and shaped corners. The label retains its fixed CSS anchor.
Resizing with a selected destination applies the same constraints.

Restored a safe sidebar bottom inset above the source mask's 52.8-unit curved
corner: at least 48px, or 60 source units on larger layouts. Reduced only the
compact desktop gaps between rows so the three VI craft rows fit at the reported
viewport. Longer lists and translations scroll within the inset region.

Validation:

- Four camera geometry tests cover edge pins, full artwork coverage, an already
  readable view, label/card overlap and insufficient space. All 76 tests pass;
  these four replace the deleted label-repositioning tests in the earlier total.
- Scoped formatting, full ESLint, TypeScript and the production build pass.
- All 12 destinations in VI/EN at widths 1490, 1355, 1920 and 390, height 714,
  DPR 1.25 and native scrollbars: **96 selections passed**. Selected labels are
  centered, fully inside the map and clear of overlays; artwork covers the map.
  Desktop list viewports end at least 48px above the sidebar bottom. No page errors.
- Normal-motion selection, close/focus restoration, keyboard focus, selected
  resize and opening a route pass. Hover does not move the camera. Across 1002
  sampled animation/interaction frames, artwork edge difference was at most 1px
  (Leaflet pixel rounding), including resizing.
- Inspected VI/EN selected Ngũ Xã screenshots at 1490 x 714. The label stays
  directly above the pin. Existing unavailable-photo fallback appears in the card.

This deliberately does **not** guarantee complete hover labels in the overview
or endpoint labels in the whole-route view. Those views retain natural clipping
and manual pan/zoom; route geometry and fitting are unchanged. Guaranteeing every
edge label in the overview while retaining full artwork coverage and the current
composition would require a separate artwork/framing decision.

Evidence: `research/design/evidence/map-responsive/selected-camera/`.
Changes remain local; the teammate's Vercel deployment will not change until
these changes are committed, merged and deployed. SPEC remains unchanged.

### Earlier follow-up: above/right labels at the true artwork boundary

The owner requested a specific distinction: compare a label with the actual map
artwork's limits, not the displayed frame. Above is the default. If the proposed
above rectangle crosses any artwork edge, put the label immediately to the right
of the 44px pin button with a 4px gap and vertical centering. This is a fixed side
placement, never a continuously sliding offset. If both placements lack room,
normal clipping still applies; no unrequested left/below fallback was added.

`label-side.ts` calculates the hypothetical above rectangle from the authored
anchor, measured label size and current Leaflet scale. Camera translation and
visible frame bounds are absent from that calculation, so panning alone cannot
change the side. Zooming, resizing and font/label size changes re-evaluate it.
The rule applies to destinations and the university label. Resize/font listeners
and observations are cleaned up when the map or motion context is recreated.

Selection/focus camera fitting still keeps the artwork covering the visible map,
but now evaluates the label footprint at each candidate zoom, because a right
label can return above when zoomed in. Hover itself does not move the camera.

Validation:

- **81 tests pass**, including true-artwork edge decisions and camera fitting
  across a right-to-above transition. Changed-file formatting, full ESLint and
  `pnpm typecheck` pass. The production build also passes with the existing
  English-content fallback notices.
- **96 destination cases**: all 12 points in VI/EN at widths 1490, 1355, 1920 and
  390, each 714px high and DPR 1.25 with native scrollbars. Hover and selected
  placements follow the artwork-edge rule. Selected labels remain attached,
  visible and clear of overlays; artwork covers the map; no page errors.
- At 1490 x 714, Ngũ Xã's VI/EN overview labels are fully visible to the right.
  Visually inspected both captures. Normal-motion zoom changes right -> above ->
  right; panning leaves the side unchanged. Pointer hover onto the label,
  Escape dismissal and reopening pass in both languages.
- The university remains centered above its pin when dragged to 20px from the
  visible frame's left edge; its label clips naturally instead of switching side.
  Opening the legend does not shift it. Route interruptions, Escape during
  dismissal, reduced-motion changes and search/category clearing still pass.

Evidence for this iteration: `research/design/evidence/map-responsive/artwork-label-side/`.
Prior evidence folders describe superseded placement rules. No artwork, data,
map bounds, minimum zoom, SPEC, dependency or lockfile changes in this follow-up.

### Latest follow-up: validate each fallback placement

After discussing the limitations of always switching right, the owner approved
trying above, right, left and below in that order. Each candidate's complete
measured label rectangle must fit the true artwork bounds. Left and below keep
the same 4px gap from the 44px pin button as right; above preserves the existing
appearance. There is no detached offset, viewport-edge repositioning, or camera
movement on hover. Zoom and text-size changes can change the chosen side;
panning alone cannot.

If none of the four placements fits, use the anchored candidate with the most
label area inside the artwork (preference order breaks ties). This is a best
effort, not a guarantee of full visibility in an arbitrarily small space.
Selection/focus camera fitting uses the chosen side's full footprint at each
candidate zoom and keeps the artwork covering the viewport. The details card
remains available if no camera solution exists. No new side-change animation or
hysteresis was added.

Validation on the production build at localhost:3000:

- **86 tests pass**, including opposite artwork edges, upper-right and top-edge
  cases, larger measured labels, no fitting candidate, and selection with left
  and below footprints. Full lint, TypeScript, production build, changed-file
  formatting and `git diff --check` pass. Existing English fallback notices
  remain in the build.
- **96 destination cases** pass: all 12 points, VI/EN, widths 1490, 1355, 1920 and
  390, height 714, DPR 1.25, native scrollbars. Checks cover placement order,
  attachment, selected-label visibility, overlay clearance and artwork coverage.
- **8 additional stress cases** pass in VI/EN with normal and reduced motion.
  Temporary browser-only 320px-wide labels, at 60px and 90px heights, force left
  and below respectively. These dimensions are test fixtures, not product CSS.
  Hovering across the gap to the label, Escape dismissal/reopening, selection,
  closing-card focus restoration and stable placement during panning pass.
  Hover does not move the camera; no browser page errors were recorded.
- Visually inspected the normal VI overview and English left/below stress
  captures. Tests use headless Edge, not the teammate's deployed Vercel page;
  physical touch/pinch, screen readers and other browser engines were not
  rechecked in this follow-up.

Current evidence: `research/design/evidence/map-responsive/label-fallbacks/`.
Changes remain uncommitted and unpushed. SPEC is byte-for-byte unchanged; no
artwork, data, map bounds, minimum zoom, dependency or lockfile changes.

### Native Edge inspection and matching legend close control

The owner requested inspection on their actual device and a legend close button
matching the location card. Used native Computer Use on the existing Edge tab
at localhost:3001/vi/maps; the browser extension host remained unavailable.
Re-executed the existing read-only DevTools viewport expression. Current values
are **1490 x 714 CSS pixels, content width 1475, DPR 1.25**, root font 16px,
search font 20px and list title font 14px. These match the teammate's supplied
viewport. The old eager-console preview still showed earlier 1355 x 649 values;
the freshly executed result is the measurement used here. The device preview's
125% presentation scale was left unchanged. No display-resolution change was
needed.

In this current local build, the sidebar heading clears the curved frame, all
three craft rows fit, and the five-place list scrolls to a fully readable final
entry above the bottom border. Ngũ Xã's selected label and card are readable.
The visible outline around the card heading after keyboard reload is the focus
indicator. The unavailable-photo copy is separate from viewport sizing:
`data/points/craft.yaml` marks the available Ngũ Xã cover temporary, and the map
page intentionally selects only non-temporary photos. No content was changed.

The enlarged legend now reuses `/maps/v2/card-close.svg`, the same ornamental
close control as the location card, with a 44px target at the default text size.
Added a white fill to the shared badge so the map or an underlying card cannot
show through its center; its geometry and lavender strokes are unchanged.
Pointer, Tab/Enter and Escape closing preserve the selected location and restore
focus to the legend trigger. Left the updated legend open in the user's tab.

The browser matrix found an existing narrow-layout issue: with a card docked
below the map, the legend popover was positioned from the enlarged canvas's
bottom and drifted over that card. It is now positioned from the map surface's
bottom, independently of the card's height; its animation still works.

Validation: 86 unit tests, full lint, TypeScript, changed-file formatting,
production build and `git diff --check` pass. **24 legend browser cases** pass:
16 reduced-motion cases across VI/EN at 1490 x 714, 1490 x 383, 1920 x 1080 and
390 x 844, each with/without a selected card; another 8 normal-motion cases at
1490 x 714 and 390 x 844. Tests assert the close target is inside the map, has
the shared SVG, works by pointer/keyboard/Escape and restores focus. No page
errors. Visually checked native desktop and narrow-screen screenshots.

Evidence: `research/design/evidence/map-responsive/legend-close/`. Native
viewport observations are recorded here rather than committing screenshots of
personal browser chrome. The teammate's Vercel deployment was not reverified;
the changes remain local and uncommitted/unpushed. SPEC remains byte-for-byte
unchanged. Map artwork, coordinates, routing data, dependencies and lockfile are
unchanged.

### November 24: close control inside the enlarged legend

Owner correction: the close control belongs inside the legend's top-right area.
Moved it from above the panel to a 12px top inset, retaining its ornamental SVG
and 44px target. At container widths up to 32rem, the icon uses a 24px drawing
inside the same target with a 4px top inset, leaving the small legend's text and
symbols visible. Pointer, keyboard dismissal and focus behavior are unchanged.

Verified 12 browser cases in VI/EN at 1490 x 714, 390 x 844 and 320 x 640, both
with and without a location card: the whole close target stays inside the panel,
and pointer, Tab/Enter, Escape and focus restoration pass. Visually inspected
desktop and both narrow legend captures. Changed-file formatting and production
build pass; the build required a network-enabled retry for Google Fonts. The
existing dev server is now on port 3000. No commit/push or SPEC changes.

Evidence: `research/design/evidence/map-responsive/legend-inside/`.

### November 24: grow the existing legend and add close feedback

The owner reported the original thumbnail showing beneath the enlarged legend.
Replaced the separate thumbnail and popover images with a `MapLegend` component
that keeps one artwork element mounted. Opening and closing use a GSAP transform
animation between the measured small and large rectangles. Interrupted motion
starts from the current painted rectangle; resizing finishes at the responsive
target. The existing artwork, enlarged layout and inside close position remain.

The ornamental close button now has a slight hover/keyboard-focus enlargement
and shadow, plus a pressed scale and darker appearance. Its hit target stays
stable. Reduced motion skips scaling and panel animation while retaining static
feedback. Closing by pointer or Escape restores focus to the thumbnail; repeated
Escape during collapse does not also dismiss the location card.

Validation on the existing development server at localhost:3000:

- **32 browser cases pass** in headless Edge: VI/EN, normal/reduced motion,
  widths 1490, 1920, 390 and 320, height 844, DPR 1.25 and native scrollbars,
  each with/without a location card. Checks verify the same single artwork
  throughout growth/shrink, intermediate animation frames, preserved artwork
  proportions, return position, inside close target, hover/press feedback,
  Space/Escape operation, visible keyboard focus and focus restoration.
- **Two interruption sequences pass**, one per language: reverse while growing,
  resize during growth and collapse, change reduced-motion preference while
  moving, select a location while open, return to the relocated thumbnail and
  press Escape twice during collapse. No browser page errors in either suite.
- Visually inspected the enlarged desktop capture: no thumbnail peeks out under
  the panel. Physical touch, screen-reader and other-browser checks were not
  repeated for this animation change.
- Changed-source formatting, lint, TypeScript, all **86 unit tests** and the
  production build pass. Existing missing-English-content fallback notices
  remain. SPEC's SHA-256 is unchanged:
  `7F65EEC1C2D9725DBC19C0A09D7C064020EF928209DE99340353C7980193DFE3`.

Evidence: `research/design/evidence/map-responsive/legend-grow/`. Prior local
work is preserved. No commit, push, dependency or lockfile changes in this
follow-up.

### November 24: keep list arrows inside their rows

Added 0.75rem right padding to each location row, leaving 8px of clearance at
the default text size after the existing 4px hover/focus movement. The list has
0.5rem of padding before the scrollbar and a stable scrollbar gutter, so
filtering to fewer results does not change the row width.

Verified 24 category/layout combinations in headless Edge: all three layers,
VI/EN and widths 1490, 1920, 390 and 320 at height 714 and DPR 1.25. Both first
and last rows retain the arrow inset and scrollbar gap without horizontal text
overflow. The final row scrolls fully into view. Keyboard selection, card-close
focus restoration and stable widths after search filtering also pass; no page
errors. Changed-file formatting and `git diff --check` pass. This follow-up is
CSS-only; SPEC and existing uncommitted work are preserved.

Measurements: `research/design/evidence/map-responsive/row-spacing/results.json`.

### November 25: scale the search text with the map layout

Follow-up to merged PR #90, tracked by issue #91 on `fix/map-search-text`.
The search input's fixed 20px override made it disproportionately large as the
desktop sidebar narrowed. At 320px, both locale placeholders exceeded the input
width. The input scales with the larger desktop composition between 1rem and
1.25rem. Following owner review, containers up to 100rem use 0.875rem (14px at the
default text size), including the stacked layout. Its 44px minimum target height
is preserved.
Removed the earlier, overridden viewport-font rule so the sizing is explicit.

16 headless Edge cases pass: VI/EN at widths 2002, 1920, 1600, 1490, 1376, 1280,
390 and 320; the teammate's 1490 × 714 size uses DPR 1.25. Measured search text is
20px at 2002, about 19.84px at 1920, and 14px at 1600 and the narrower
sizes. Both placeholders fit, filtering by D02 and clearing work, and no page
errors occur. Reviewed before/after captures. Evidence:
`research/design/evidence/map-responsive/search-sizing/`.

The owner authorized publishing this as a hotfix. Lint, TypeScript, all 90 tests
and the production build pass. The default format check reports the same 183 untouched CRLF checkouts;
formatting with checkout line endings accepted passes. SPEC is byte-for-byte
unchanged. The PR targets `dev` and closes #91.
