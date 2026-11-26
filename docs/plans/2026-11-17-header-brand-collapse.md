# Header brand collapse and expansion

Owner request: implement the collapse/expand behavior studied in the supplied
Anthropic recording on our brand logo. Keep the existing opening sequence: the
lettering must settle before the header and page reveal. Preserve SPEC.md.

## Implementation

- Use the existing three-color roof symbol as the compact brand. Fade/retract the
  wordmark and UNESCO designation, then move the roof symbol horizontally into
  the center of the unchanged logo link. Keep its height and proportions.
- Reverse the same paused GSAP timeline when returning toward the beginning of
  the page: the symbol moves back before the text becomes visible. Allow reversal
  mid-transition. No new artwork or motion dependency.
- Keep the homepage header sticky so the interaction remains visible while the
  article-like page scrolls below. Keep original header size, navigation and SVG
  frame corners. Reuse the extracted frame components for the sticky backdrop.
- Enable collapse only after the opening, using separate collapse/expand distances
  to avoid jitter near the threshold. Reset immediately before the opening morph
  takes over again. Initialize a restored/scrolled page in its correct state.
- Add semantic symbol/copy wrappers through the canonical SVG extractor. Animate
  wrappers, leaving source path attributes untouched for the opening's geometry
  reader. Recalculate opening target positions relative to the now-sticky header.
- Use `useGSAP` and media-context cleanup. Reduced motion and no JavaScript keep
  the expanded logo. Preserve the accessible home link and keyboard navigation.

## Results — 17 November 2026

Implemented in `HomeHeaderMotion`. The transition lasts 0.53 seconds: copy fades
and retracts over 0.18 seconds; the roof moves over 0.45 seconds starting at 0.08.
Collapse begins after the opening plus `max(48px, header height * 0.4)` of scroll.
Expansion begins below 40% of that distance. These are our tuning choices, not
measurements of Anthropic's source code. Returning into the opening resets the
brand immediately so the earlier morph receives the full logo.

- Seven new browser check groups pass in production Edge: four viewport sizes
  (1920, 1440, 390 and 320px), stable symbol dimensions and centering, stable sticky
  header, accessible link, threshold hysteresis, interrupted reversals, fast
  return to opening, resize, reload, four locale switches, search, map navigation,
  reduced motion and no-JavaScript fallback. No captured JavaScript page errors.
- All 24 existing browser groups pass again: eleven opening motion, four
  lifecycle/touch, four integration and five reveal/focus groups. The lettering
  still stops before any page/header reveal. Touch checks used Edge emulation.
- Personally inspected the collapse/expansion contact sheet, full compact page,
  opening sequence and endpoint comparison. Header endpoints match the static
  artwork pixel-for-pixel at four sizes. Opening endpoints have mean channel
  differences below 0.014/255 and no pixels differing by more than 16/255.
- Original logo path data, fills and viewBox are unchanged. All 38 generated art
  files reproduced byte-for-byte on repeat extraction. Only the logo's semantic
  wrappers change in the generated output.
- Changed-file formatting, lint, TypeScript, all 38 existing tests and production
  build pass. Tests used explicit Windows file enumeration because the package
  script's single-quoted glob is not expanded by this shell. Build: 61 pages,
  110 existing untranslated fields using Vietnamese fallback.
- SPEC SHA256 remains
  `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
  No package or lockfile changes.

Evidence and tuning notes:
[implementation research](../../research/design/2026-11-17-header-brand-collapse.md).

## Remaining limits

Safari, Firefox, physical devices, screen-reader audio and performance across
hardware were not tested. The current desktop artboard scales at narrow widths;
these checks verify animation geometry, not approval of a readable mobile layout.
External route data requests in this preview were blocked by sandbox network
access (`EACCES`); an earlier network-enabled preview reported `Invalid API key`.
Navigation/mount checks pass, but external data and authenticated flows remain
unverified. Repository-wide
formatting debt is unchanged. This change applies to the homepage SVG header.

The earlier Anthropic study and its evidence are retained in `research/design/`.
No commit or push was requested for this implementation.
