# Map motion

Implement the owner's approved motion proposal on the existing map page:
entrance, theme and search transitions, linked row/pin hover and keyboard focus,
selected icon emphasis, interruptible bounded camera, card arrival/content swap/close,
and legend reveal. Reuse the source artwork and GSAP through useGSAP. Respect
reduced motion, including preference changes while the page is open.

Keep map bounds, canonical content, VI/EN, links, and focus restoration intact.
SPEC Part 3 leaves map interactions to the map owner; preserve SPEC unchanged.
Continue the existing local branch scope: no commit, push, or remote publication.

Validate in the approved headless Edge workflow with normal and reduced motion,
rapid repeated interactions, interrupted camera moves, desktop/mobile, and the
existing bounds/card regression scripts. Run formatting, lint, types, tests, build.

## Result

Implemented and validated. The motion matrix covers desktop/mobile, both motion
preferences, rapid input, camera interruption, selection changes, focus
restoration, and locale navigation during card exit. All 24 VI/EN card cases and
the mouse/keyboard/pinch/resize bounds checks pass. 6,121 animation frames showed
no blank map edges. Scoped formatting/lint, TypeScript, 44 tests and build pass.
See `design-qa.md` and `research/design/evidence/map-motion/`. SPEC unchanged;
no commit, push or remote publication.

Owner review replaced the circular selection treatment with a 35% larger theme
icon lifted 6px and a persistent name label with a theme-colored underline. The
label stays inside the map and clear of the location card while panning/zooming.
All 12 locations pass at desktop/mobile sizes across VI/EN and both motion
preferences (48 selection checks). Formatting, ESLint and TypeScript pass.

## Map heading matched to Explore — 2026-11-24

The owner requested the map introduction to use the same arrival motion as
Khám Phá → Địa. Extracted Explore's existing title/line/caption timeline into
`src/features/home/motion/heading-reveal.ts`; both pages now call it. The title
rises from 70% of its height with a clipped reveal over 1.5 seconds. The original
lavender rule draws along its path with `power2.inOut`, and the caption reveals
from the title's side after a 0.15-second delay with a 40-composition-unit drift.

Inlined the exact path from `public/maps/v2/heading-rule.svg` for DrawSVG access.
Its geometry, color and final layout remain unchanged. The existing map explorer
arrival is preserved. A pre-hydration hold prevents a finished heading flashing
before animation; its four-second fallback reveals the content without JavaScript.
Reduced motion renders the final state immediately and reverts an active entrance.

Validation: 10 headless Edge cases cover VI/EN, map widths 1920/390, normal/reduced
motion, and the Explore reference in both languages. Frame sampling confirms
title rise, caption drift and progressive path drawing without scaling the SVG.
Additional checks pass for changing reduced motion during both pages' entrances,
Explore gate navigation, client navigation from Explore detail into the map, and
no-JavaScript visibility with both preferences. Comparison captures and compact
results are in `research/design/evidence/map-motion/heading-reveal/`.

Formatting, lint, TypeScript, 86 tests and production build pass. The build still
reports the existing 109 untranslated content fields, which fall back to Vietnamese.
SPEC is byte-for-byte unchanged. No commit or push.

## Keep the legend anchored during selection — 2026-11-24

Removed the selected-card CSS rule that moved the collapsed legend to the left
and reduced its size. Selection and dismissal now preserve its source position
and size at the bottom right. The desktop card ends at least 12px above the legend;
longer content scrolls, while the mobile card still flows below the map.

The card's scroll viewport is separate from its natural-height artwork body so
the badge stays beside the explore action. The inner container measures the width
after the scrollbar, preventing photo overflow. The close button remains outside
the scroller. Removed the narrow-container overflow override, which matched the
card's own container and incorrectly disabled scrolling even on desktop.

24 headless Edge selection cases pass across all three layers, VI/EN, widths
1920, 1490, 1280 and 390, including 1490 × 714 at DPR 1.25. Checks cover unchanged
legend bounds on selection/close, card separation, reachable directions, no
horizontal scrolling, expansion/contraction, one artwork node and focus return.
Real wheel scrolling with Lenis and closing a scrolled card also pass at the
teammate's viewport. Evidence: `research/design/evidence/map-motion/legend-anchor/`.
Formatting, lint, TypeScript, 86 tests and production build pass. SPEC unchanged;
existing heading motion work preserved. No commit or push.

## Consistent location-card dimensions — 2026-11-24

Owner review found differing card sizes. At a 1920px viewport the five Địa cards
were 398–437px tall despite sharing a 312px outer width. The scrollbar also reduced
the artwork body from 312px to 302px only on overflowing cards.

The frame now uses the source's 314.5:415.1 aspect ratio and a zero automatic
minimum height, still capped by the space above the legend on desktop. Its size
depends on the viewport, not the selected text. A stable scrollbar gutter keeps
the artwork width consistent; longer content scrolls inside the shared frame.
Each selection resets the internal scroll position before the entrance/crossfade.

96 headless Edge checks cover all 12 points, VI/EN and widths 1920, 1490, 1280 and
390 (1490 × 714 at DPR 1.25). Every point matches its viewport's frame position,
width/height, body width and photo-strip dimensions. Selection starts at scroll
zero, directions remain reachable, no horizontal overflow occurs, and the legend
stays clear and stationary. Compared D01/D02/D03 captures directly. Evidence:
`research/design/evidence/map-motion/card-consistency/`.
Changed-file formatting/lint, TypeScript and production build pass. SPEC unchanged;
no commit or push.

## Small-screen card correction — 2026-11-24

The owner's 1490 × 714 capture showed that matching DOM rectangles and checking
scroll reachability were insufficient: the primary actions disappeared inside
the scroll area, and the SVG frame letterboxed when the panel's height differed
from the source aspect ratio. This correction supersedes the whole-card scroll
layout described above.

The header and action rows now stay inside the frame. Only the photo/title/address/
quote area scrolls, with a keyboard-focusable reading region and a subtle bottom
fade. Titles scale with the card width while keeping a readable minimum; both
actions retain 44px minimum targets. Selection resets the reading region. The
frame uses the original SVG as a nine-slice border, preserving the corner shapes
while extending its edges. Only the SVG's intrinsic width/height metadata changed;
its source paths and colors did not.

The existing stacked layout begins at 85rem container width (1360 CSS px), before
the desktop composition becomes cramped. Stacked cards have a 28rem minimum
height. Between that breakpoint and 100rem, the legend uses its 140px compact
footprint with the source corner insets, consistently before/after selection.
Its expansion remains available. Constrained search widths keep the source search
outline around the input in the newly stacked range.

Validation: 144 current headless Edge cases cover all 12 points and both languages
at widths 1920, 1490, 1376, 1280, 390 and 320. The 1490 × 714 cases use DPR 1.25;
VI at that size uses normal motion. Checks now require actions and close to be
visible and hit-testable before scrolling, no header/footer overlap, stable frame
dimensions, no horizontal overflow, and stationary legends. D01/D02/D03 titles and
addresses must be initially visible. Scrolling leaves the actions fixed.

Reviewed fresh card and viewport screenshots, including the actual painted border
at 320px. Real wheel scrolling with Lenis, Home/End keyboard reading, reduced-motion
switching, directions, closing and legend expansion pass at the reported settings.
Evidence: `research/design/evidence/map-motion/card-small-screen/`.
Formatting, lint, TypeScript, 86 tests and production build pass; SPEC unchanged.
The shared mobile header/footer still have separate layout issues visible in the
full-page captures; this verification covers the map cards and their controls.
No commit or push.

## PR preparation — 2026-11-24

The owner authorized committing, pushing and opening a PR into `dev`. This
supersedes the earlier local-only publication scope. The latest `origin/dev`
merges cleanly with this branch; no merge into `dev` is performed here.
Tracking issue: [#89](https://github.com/XMAI-GRAD/project-XM/issues/89).

Full lint, TypeScript, all 86 tests and production build pass again. The standard
format check found 183 untouched Windows CRLF files and five saved map QA reports
with formatting differences. Formatted only those five reports. All source and
report formatting passes when accepting checkout line endings; `core.autocrlf`
is enabled locally, while the repository blobs and Linux CI use LF. SPEC remains
byte-for-byte unchanged. The existing 109 untranslated content fields still fall
back to Vietnamese. Browser results and the shared mobile header/footer limitation
recorded above remain applicable.
