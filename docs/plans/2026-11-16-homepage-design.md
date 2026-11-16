# Homepage from the supplied Illustrator artwork

Branch: `feat/homepage-design`, from `dev` at `fcccc52`. The owner requested personal inspection of all supplied design files and a first implemented homepage. No delegation of source reading. No commit, push or deployment requested.

## Source and scope

Read all six files under `D:/XMAI GRAD/workspace/File`: the four SVG artboards, the four-page PDF and the PDF-compatible Illustrator master. The homepage starts with the blue WEB-01 opening screen, followed by WEB-02, 1920 by 5400 units. WEB-03 extends the palette, and WEB-04 is an asset/motif library.

The new design is authoritative for this homepage. Preserve SPEC byte-for-byte under the owner's continuing instruction; record differences here and in research rather than rewriting it. Keep the existing map and other routes usable. The supplied homepage has no events-card section or footer; their routes remain reachable through navigation.

## Implementation

1. Measure and document source geometry, actual used colors, fonts, outlined lettering, and asset provenance. Extract only the supplied vectors needed at runtime; keep raw AI/PDF/full artboards outside the public repository.
2. Isolate the new homepage frame from the legacy frame used by other routes. Match the 1920-wide reference with 180-unit outer margins, a 180-unit header, a 78-unit navigation strip and the measured section heights.
3. Build semantic, localized sections and functional navigation, search, menu, join and map links. Use original vectors for decorative architecture and lettering with custom glyphs; use HTML for ordinary text, counts and controls. Preserve source colors through explicit additional tokens.
4. Adapt the supplied desktop composition for smaller screens without shrinking text into unreadability. No mobile artboard is supplied, so this is an implementation adaptation rather than a designer-approved mobile layout.
5. Compare actual browser screenshots against source renders at 1920 pixels and focused crops. Check 1440 and narrow layouts, keyboard/focus/menu/search/locale behavior, reduced motion and existing-map navigation. Run appropriate formatting, lint, TypeScript, tests and build.

## Content questions to document, not block implementation

- The header shows a sample temperature and placeholder date. Do not claim a live weather integration. The date can reflect Hanoi local time; label the reference temperature honestly.
- The source supplies statistics without a citation or reference date for each number. Preserve them as supplied editorial content and record their provenance for owner verification.
- SVG outlines preserve customized heading glyphs, but do not reveal reliable editable font weights. Retain the original stylized artwork with semantic text; compare ordinary Phudu/Inter typography visually.
- The palette board still labels seashell `#fff6f1`, while the homepage actually uses `#fff8f5`. Additional saturated and pale variants occur in the artwork; do not silently replace existing site tokens.

## Completed implementation and validation

All five implementation steps are complete for the first homepage. See [source findings](../../research/design/2026-11-16-homepage-source-study.md), [asset provenance](../../research/design/homepage-asset-manifest.json), and [QA/evidence](../../design-qa.md).

- Read all supplied files personally and extracted 27 original SVGs (about 161KB total) with a source-hash-checked script.
- Implemented the measured homepage, mobile reflow, functional header search, menu, locale links, join/map links and category-aware Explore destinations. Kept other routes on their existing frame.
- Compared the 1920 × 5400 rendered page with the source at full size and in five focused combined comparisons. Inspected 1440, 768, 390 and 320px layouts; no horizontal overflow or broken images.
- Fixed numeric/label typography, text offsets, mobile heading readability, menu focus/tap behavior and duplicate locale skip-link IDs found during verification.
- All twelve production-browser interaction groups passed with no captured JavaScript page errors. Reduced-motion and emulated touch were checked. Physical devices, Safari/Firefox and screen-reader audio were unavailable/not tested.
- Lint, TypeScript, changed-file formatting, 38 existing tests and production build passed. Build generated 61 pages; 105 fields use the project's Vietnamese fallback. No new package dependency or lockfile change.
- SPEC remained byte-for-byte unchanged (SHA256 `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`). Map datasets, calibration and saved routes were preserved. No commit or push.

Remaining review items are source/design decisions: low-contrast text colors, extra shade naming and paper-color discrepancy, editorial statistics and dates, sample weather, unfinished craft caption, full English copy/artwork, and approval of the mobile/menu adaptations. The QA result covers faithful implementation and supported interactions, not certification of these source choices.

## Owner correction: opening screen and outer gutters

The initial implementation incorrectly omitted WEB-01 from the page sequence. Its exact original logo now sits on a viewport-height navy opening section. Scrolling continues into WEB-02; clicking the logo or pressing Enter focuses the header, and the skip link still bypasses directly to content. There is no artificial loading timer.

Removed the 1920px width cap and centered outer margins. The homepage now scales to its full container width, including 2560px, while retaining the lime frame in the artwork. Verified 1920, 2560, 1440, 390 and 320px: both sections span from X=0 to the viewport's right edge without overflow or missing images. Lint, TypeScript, production build and all twelve browser interaction groups passed again. Updated evidence is in the QA report; SPEC remains unchanged.
