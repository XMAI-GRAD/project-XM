# Homepage design QA — SVG migration, 17 November 2026

## Current dev merge

**Final result: passed** for the combined design and motion in tested production Edge.
Dev `c76afd2` supplies the section choreography, new About/Explore layouts, footer,
cursor and extracted artwork. Our opening morph, horizontal floating brand and
composition hold remain active. Only entrance timing is adapted to the additional
opening/hold distance; the incoming easing, durations and hover behaviors remain.

Resolved two integration findings: hero playback now begins on exact opening-link
entry, and shared About/Explore header links return to the homepage header after
motion initialization. Ordinary Back still restores the previous deep scroll.
All generated art except the two brand components matches dev byte-for-byte; those
two retain the same outlines/fills/viewBoxes with combined animation hooks.

- [Personally inspected combined motion/design captures](research/design/evidence/dev-motion-merge/merge-contact-sheet.png)
- [Conflict resolutions, validation and limitations](docs/plans/2026-11-17-dev-motion-merge.md)
- [Combined section checks](research/design/evidence/dev-motion-merge/merge-results.json)
- [History, resize and reduced-motion return](research/design/evidence/dev-motion-merge/history-results.json)

Lint, 38 tests, TypeScript, production build, resolution-file formatting and browser
checks pass. New section entrances, drawings, counters, hover interactions and
shared-page navigation were checked alongside the earlier opening/rail regression
checks. SPEC remains unchanged. Physical devices, other browser engines and external
authenticated data flows remain outside this verification. Dev's Explore currently
shows the place layer only; its taste/craft designs remain an upstream follow-up.

## Current floating rail brand

**Final result: passed** for the requested homepage interaction in tested Edge.
This supersedes the sticky-header collapse described below.

The owner subsequently corrected the direction: the logo now moves horizontally
left and floats at its original header height. Vertical translation only cancels
page scrolling. Current travel/full-page captures show this correction; the
normalized crop below compares artwork, not its current viewport y position.
The header, main content and original frame now stay together throughout travel
and begin scrolling away only after docking. The logo remains at the same height
through both phases. Updated checks assert the held composition and its release.

Source: the supplied pale-logo rail screenshot, identified as the original
`RailMark` in `docs/lttem/svg/WEB-02-HomePage.svg` (`/79`). The source crop's unknown
zoom is not treated as a full-page sizing specification. Comparison uses that
canonical asset rendered in the project at 1920x1080 CSS px, DPR 1. Both focused
rail crops are 180x240 px, x=0/y=280, displayed at equal scale.

- [Combined source/implementation crop](research/design/evidence/floating-rail-brand/rail-comparison.png)
- [Frame correction before/after](research/design/evidence/floating-rail-brand/frame-fix-comparison.png)
- [Corrected frame at the reported viewport](research/design/evidence/floating-rail-brand/frame-user-viewport.png)
- [Full docked page](research/design/evidence/floating-rail-brand/rail-page.png)
- [Travel sequence after the layering fix](research/design/evidence/floating-rail-brand/rail-travel-sequence.png)
- [Implementation, evidence and checks](research/design/2026-11-17-floating-rail-brand.md)

| Fidelity surface | Result                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typography       | Original extracted header lettering and surrounding type retained; lettering retracts during travel.                                                                                                   |
| Spacing/layout   | Rail dimensions and x alignment preserved; logo y stays at header height. Header, hero and frame hold together until docking, then scroll away. Extra hold distance is reserved below the artwork.     |
| Colors           | Source colors stay visible over paper. Complementary clips reveal the canonical pale mark where the original lime rail passes behind it; no extra lime panel.                                          |
| Asset quality    | Original SVG at both endpoints, temporary clone during travel. Mean rail raster channel difference 0.60/255, confined to small edge-rendering differences; no claimed pixel-perfect rail raster match. |
| Copy/content     | Existing editorial content unchanged; localized return labels added in VI/EN.                                                                                                                          |

First visual review found a P2: the navigation tab covered the lower part of the
moving logo. The logo now sits above the header controls. Revised travel captures
were inspected and the full symbol remains visible.

The owner's later screenshot identified another P2: holding only the header cut
off the hero's rounded frame, and the extra lime panel looked detached. Holding
header, main content and original frame together fixes that composition. Removed
the extra panel and synthetic header background; color masks follow the actual
rail edge. Personally inspected docking, release and the reported 2477x673 viewport.
Travel inspection also caught a weather-text collision; the weather/date now fades
only while the symbol crosses its slot and returns after it passes.
No actionable P0/P1/P2 findings remain in this tested interaction scope. Minor
raster edge differences are P3 follow-up.

Before the frame correction, 34 browser groups/cases passed: ten rail/return cases and the 24 opening,
lifecycle/touch and integration groups. Verified pointer, Enter and emulated-touch
return to the header; cancellation; reversibility; deep/bottom scrolling; resize;
reload; four locale switches; reduced motion; no JavaScript; search and map cleanup.
No captured JavaScript page errors. Lint, TypeScript, 38 tests and production build
pass; formatting checked for changed files. Opening/header endpoint pixel comparisons
are identical at four sizes. These test and pixel results are historical.

The latest frame correction passed 26 browser groups: four frame checks, six rail,
five opening sequence, four lifecycle/touch, four integration, and three extra
page-bottom/touch/navigation checks. No captured JavaScript page errors. Production
build including TypeScript and targeted lint passed; changed-file formatting is
checked. SPEC, generated source art and dependencies are unchanged.

Physical-device/cross-browser/performance validation and a readable mobile redesign
remain future work. External data requests were blocked by the local sandbox;
navigation and map mounting passed. The in-app browser host was unavailable, so
the established local Edge setup supplied the screenshots and interaction checks.

## Latest header brand interaction

The homepage SVG brand now collapses to its original roof symbol after the opening
and expands again near the top. The sticky header keeps its size and navigation;
the symbol keeps its proportions. Source SVG outlines, fills and viewBox remain
unchanged. Reduced motion and no JavaScript retain the expanded brand.

- [Personally inspected transition frames](research/design/evidence/header-brand-collapse/brand-sequence.png)
- [Compact header in the page](research/design/evidence/header-brand-collapse/compact-page.png)
- [Implementation, evidence and tuning](research/design/2026-11-17-header-brand-collapse.md)
- [Validation record and limitations](docs/plans/2026-11-17-header-brand-collapse.md)

Seven new brand-animation groups and all 24 existing browser regression groups
pass in production Edge. All 38 tests, lint, TypeScript and build pass; formatting
is checked for changed files. The opening still waits until its lettering settles
before showing the page. Header endpoints match the static SVG pixel-for-pixel;
opening endpoint differences average less than 0.014/255 per channel, with no
pixels differing by more than 16/255. SPEC and dependencies are unchanged.

This latest evidence supersedes earlier motion results below. Physical devices,
other browsers, a readable mobile redesign and external data flows remain outside
this validation. No commit or push was requested for the brand interaction.

## Latest opening transition

The lettering now finishes moving into the brand logo before any header, content,
frame or other logo detail appears. It settles at 72% of the opening scroll and
holds its exact viewport position while the page reveals over the remaining 28%.
The header controls enter from above during this second phase. The homepage
reaches its original layout at the endpoint.

- [Current transition frames](research/design/evidence/settled-wordmark-reveal/morph-contact-sheet.png)
- [Current endpoint comparison](research/design/evidence/settled-wordmark-reveal/comparison-morph-endpoints.png)
- [Sequence measurements and focus checks](research/design/evidence/settled-wordmark-reveal/sequence-results.json)
- [Implementation and full validation record](docs/plans/2026-11-17-opening-header-reveal.md)

All 24 current browser groups pass: eleven motion, four lifecycle/touch
and four integration groups, plus five sequence/focus/cleanup groups. Lint,
types, 38 existing tests and production build pass. Static endpoint comparisons
have zero pixel difference at all four tested sizes. Physical-device and cross-browser limitations
below still apply. No artwork was redrawn and SPEC.md remains unchanged.

The migration report below records the earlier transition and its evidence;
follow the links above for the current motion.

## SVG migration report

Current result: **passed for the SVG migration and preserved scroll/morph**.
This report verifies integration with the team's `dev` homepage. It does not
claim a new complete PDF fidelity audit or mobile usability approval.

The active implementation uses the remote homepage composition, content schema
and inline SVG components. Only the opening interaction and its entry/skip
accessibility behavior were carried over. The former image-based homepage,
custom menu/mobile layout and duplicate brand path dataset are removed.
See [the implementation record](research/design/2026-11-17-svg-homepage-migration.md).

## Current visual evidence

- [Full SVG homepage at 1920px](research/design/evidence/svg-homepage/homepage-svg-1920.png)
- [Six scroll/morph frames](research/design/evidence/svg-homepage/morph-contact-sheet.png)
- [Endpoint comparison](research/design/evidence/svg-homepage/comparison-morph-endpoints.png)
- [Endpoint pixel measurements](research/design/evidence/svg-homepage/morph-pixel-comparison.json)
- [Emulated touch scroll](research/design/evidence/svg-homepage/morph-touch-scroll.png)

| Surface        | Migration result                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography     | The remote HTML typography and extracted glyph components are active; the old alternative heading/layout treatment is removed.                                   |
| Spacing/layout | The remote desktop artboard remains 1920×5400 at a 1920px viewport, starting at x=0. Motion measures the real opening/header rather than replacing their layout. |
| Colors         | Remote SVG fills and page styles are retained. Both wordmarks' outlines, fills and viewBoxes were compared with `origin/dev` and are unchanged.                  |
| Image quality  | The page uses inline SVG artwork, with no old `/home/` image requests. Regenerating all 38 art files twice produced identical bytes.                             |
| Copy/content   | The remote YAML schema and content are active; VI/EN entry and skip labels remain localized. Existing English editorial fallback remains.                        |

Both endpoints match the static generated SVGs with zero changed pixels at
1920×1080, 2560×1440, 390×844 and 320×700. Intermediate frames were also visually
inspected: letter identity, color boundary, scale and header handoff are preserved.

## Current behavior and checks

- [Eleven motion groups](research/design/evidence/svg-homepage/morph-results.json)
  pass: endpoints/reversal, resize, moving link, fast scroll, reduced motion,
  entry/skip keyboard focus, hash reload and no-JavaScript fallback.
- [Four lifecycle/touch groups](research/design/evidence/svg-homepage/morph-lifecycle-results.json)
  pass: repeated locales, one active morph/observer, unique local SVG references,
  cleanup on map navigation, preference changes, touch swipe and moving-logo tap.
- [Four integration groups](research/design/evidence/svg-homepage/integration-results.json)
  pass: unchanged source geometry, active SVG artboard, search and Back/Forward/Back
  restoration, Escape, shared route navigation and return. These runs recorded
  no JavaScript page errors.
- A plain hash anchor created a history entry without Next's router state, leaving
  the previous page visible after Back. `HomeSectionLink` now uses Next Link and
  explicitly focuses the anchor destination without an extra scroll. Both history
  restoration and keyboard focus were retested successfully.
- Production build passes: 61 pages, 110 existing English field fallbacks.
  TypeScript, lint and all 38 existing tests pass. Windows tests use explicitly
  expanded filenames; the package script's quoted glob is incompatible with this
  shell. Changed-file formatting is checked; the previously reported repository-wide
  formatting debt is outside this migration.

The remote desktop artboard scales at narrow widths; motion works there, but a
readable mobile layout remains future work. Physical devices, Safari/Firefox,
screen-reader audio, authenticated flows and frame-rate profiling across hardware
are unverified. Initial sandboxed previews could not fetch some external route
data; the final preview was rerun with network access, where existing server data
requests reported `Invalid API key`. Route navigation and the homepage work, but
those data-backed areas were not validated. This was not a full audit of external
services. Source contrast/editorial concerns from the earlier
study remain open design/content questions.

SPEC.md is unchanged. The owner requested a local checkpoint commit after the
opening transition update; no push was requested.

---

## Historical QA — superseded image-based homepage

Everything below describes the earlier implementation and its original evidence.
Its menu/mobile behavior and twelve-group regression results are **not** claims
about the current SVG homepage.

### Homepage design QA — 16 November 2026

final result: passed

Scope: first homepage implementation against the owner's supplied desktop design, plus the implemented responsive and interaction states. This is a fidelity/implementation result, not a WCAG AA certification or approval of the source's editorial facts. Source contrast and editorial limitations below remain decisions for the owner/designer.

## Targets and browser evidence

**Owner correction:** WEB-01 now precedes WEB-02 as a full-screen blue opening. The 1920px width cap has been removed, allowing the homepage to reach both outer viewport edges on ultrawide screens. The source's lime frame remains. New evidence:

- [Opening source left / implementation right](research/design/evidence/comparison-opening.png)
- [Opening at 1920px](research/design/evidence/opening-1920.png) and [390px](research/design/evidence/opening-390.png)
- [Homepage filling a 2560px viewport](research/design/evidence/edge-to-edge-2560.png)
- [Opening, edge and keyboard measurements](research/design/evidence/opening-results.json)

Both sections have X=0 and viewport width at 1920, 2560, 1440, 390 and 320px; the opening fills the viewport height. Its source colors, centered artwork, scale and proportions match at the reference viewport. Pointer/Enter entry, skip link, English entry and reduced-motion checks passed. Lint, TypeScript, build and all twelve existing browser interaction groups were rerun successfully, with no page errors. The original 38 unit tests were not rerun for this markup/CSS correction. There are now 27 source-derived SVG assets including the opening logo.

Source: `workspace/File/SVG/WEB-02.svg`, 1920 × 5400, cross-checked against page 2 of WEB.pdf and the PDF-compatible WEB.ai. Implementation: local production preview `http://localhost:3101/vi`, with `/en` and related routes checked. Browser: installed Microsoft Edge 157 through isolated Playwright; device scale factor 1.

- [Source left / implementation right, full comparison](research/design/evidence/comparison-full.png)
- [Header and hero](research/design/evidence/comparison-0.png)
- [Connections, copy and infrastructure](research/design/evidence/comparison-1138.png)
- [Roles diagram](research/design/evidence/comparison-2416.png)
- [Heritage statement and metrics](research/design/evidence/comparison-3240.png)
- [Three themes and map link](research/design/evidence/comparison-4316.png)
- [Actual 1920px browser capture](research/design/evidence/home-1920.png)
- [390px adaptation](research/design/evidence/home-390.png) and [320px adaptation](research/design/evidence/home-320.png)
- [Viewport measurements](research/design/evidence/visual-results.json) and [interaction results](research/design/evidence/behavior-results.json)

The combined comparisons were inspected directly, including all five enlarged regions and the new opening comparison. They are not separate screenshots claimed to be side-by-side. WEB-02 remains 5400px tall at 1920px, below the opening screen. Section tops relative to WEB-02 differ from its reference by less than 0.06px due to CSS fractional layout. Initial measurements also cover 1440 × 1080, 768 × 844, 390 × 844 and 320 × 844; the new opening measurements verify the corrected page sequence and add 2560 × 1440. No horizontal overflow or failed images in normal loading.

## Opening scroll morph

Final result: **passed** for the implemented interaction and tested environments.

The opening now recedes with native scrolling while all 17 original letter paths
move and morph into the measured header wordmark. Both endpoints display the
original SVGs; the moving opening link follows its artwork. No source colors,
text, homepage section dimensions or outer gutters changed.

- [Six-stage desktop sequence](research/design/evidence/morph-contact-sheet.png)
- [Original versus implemented endpoints](research/design/evidence/comparison-morph-endpoints.png)
- [Emulated touch mid-scroll](research/design/evidence/morph-touch-scroll.png)
- [Motion measurements](research/design/evidence/morph-results.json),
  [lifecycle/touch results](research/design/evidence/morph-lifecycle-results.json),
  [endpoint pixel comparisons](research/design/evidence/morph-pixel-comparison.json)
- [Implementation and source notes](research/design/2026-11-16-opening-scroll-morph.md)

Inspected start, 25%, 50%, 75%, 90% and completion. Corrected an early A/N pairing
that caused crossing at intermediate progress; fixed the moving link's hit area;
restored the original static SVG rasterization at completion. Final endpoint
captures match the original static images pixel-for-pixel at 1920, 2560, 390 and
320px widths. This verifies the endpoint handoff; the contact sheet separately
shows the actual morph. Original typography, spacing, colors, vector quality and
copy remain as assessed in the five-surface review below.

Eleven motion check groups, four lifecycle/touch groups and all twelve existing
homepage interaction groups pass in production Edge without JavaScript page errors.
Reduced motion works both on initial load and when switched live; no-JavaScript
entry works. Resize during the transition, reverse/fast scrolling, keyboard anchors,
locale retention/unique SVG references, observer cleanup and native touch swipe/tap
were checked. Physical devices, Safari/Firefox, screen-reader audio and performance
across hardware remain unverified. Lint, types, 38 tests and production build pass.
SPEC remains unchanged; no commit or push for this interaction.
Changed-file formatting passes; repository-wide `pnpm format:check` reports 157
existing unchanged files. No broad formatting rewrite was included.

## Five fidelity surfaces

| Surface               | Evidence and result                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fonts/typography      | Original roof/star letterforms and brand lockup preserved as SVGs with semantic headings. Ordinary Phudu/Inter HTML compared at enlarged scale. Adjusted metric weight/size/spacing and role-label family/case. Remaining font rasterization and a few glyph-width differences are P3; source outline weights are not fully recoverable. Mobile connections heading becomes readable HTML. |
| Spacing/layout rhythm | 180-unit header, 77.96-unit navigation, 180-unit side margins, 1560-unit content width, measured overlaps and section heights reproduced. Corrected intro, CTA and caption offsets after comparisons. Mobile intentionally reflows because no mobile source was supplied.                                                                                                                  |
| Colors/tokens         | Original vector fills retained. Homepage-specific paper `#fff8f5`, bright blue, amber, lime and mauve added without remapping the existing map palette. Source-defined low contrast is preserved and documented below.                                                                                                                                                                     |
| Image quality         | All 27 graphics come from supplied vectors, including the opening logo. No invented replacement artwork, full-page raster flattening, blur or missing hero image. Explicit image dimensions and source aspect ratios retained; search outline adapts to the mobile field.                                                                                                                  |
| Copy/content          | Vietnamese source copy and statistics transcribed to YAML. Search and navigation use real content/routes. Current Hanoi date intentionally replaces the date placeholder; temperature remains an explicitly described sample. English controls are translated; untranslated editorial content follows the existing Vietnamese fallback.                                                    |

## Comparison and correction history

1. **Initial desktop comparison:** the large layout and original artwork aligned, but role labels used mixed-case Inter, numeric metrics were too heavy, join/map labels were too low, and theme captions sat approximately 20px too high. Classified as P2 typography/spacing differences. Replaced the role treatment with uppercase Phudu, refined metric weight/size, and measured ink positions before correcting offsets. The final focused comparisons above show the revised alignment.
2. **Responsive comparison:** the decorative connections title became too small when scaled; the 320px thesis broke into awkward fragments; the search placeholder was clipped. P2 readability issues. Reflowed the mobile connections heading as HTML, adjusted the smallest thesis size, and widened the mobile search field while preserving a 16px input font. Final narrow captures show these corrections. There is no claim that this mobile arrangement was supplied by the designer.
3. **Interaction checks:** native dialog Tab traversal reached browser chrome; the mobile header intercepted the menu tap; language switching left duplicate `home-content` targets. P1/P2 usability issues. Added an explicit menu focus cycle, corrected menu layering, and scoped the skip target by locale. Search/dialog and Explore IDs remain scoped per mounted instance. All twelve interaction groups passed afterward on the production build with no captured page errors.
4. **Final comparison:** re-rendered at the same desktop viewport and inspected full and focused combined comparisons. No actionable P0/P1/P2 implementation drift remains within this fidelity scope. Remaining P3 differences concern ordinary font outlines/antialiasing and small text widths, not the supplied artwork or major layout geometry.

## Behavior verified

- One visible h1 and all five primary destinations; skip link focuses the intended content.
- Menu keyboard containment, Escape, close action and trigger focus restoration.
- Accent-insensitive search, actual result URLs, arrow-key focus, Escape clearing and no-results message.
- Repeated VI → EN → VI navigation; exact search names and no duplicate DOM IDs, including retained hidden pages.
- All three theme links open the correct Explore tab; invalid category falls back to Place.
- Homepage → map → homepage uses the correct frame; the Leaflet map still mounts.
- Join and map calls to action reach their pages.
- Emulated mobile touch opens/closes the menu and navigates to the map.
- English at 320px and reduced-motion mode; no homepage animation and no horizontal overflow.
- Blocked hero illustration request: semantic heading and navigation remain available. This is not a claim that every external-service failure mode was tested.
- No captured JavaScript page errors in the final interaction and screenshot runs.

## Known source constraints and limits

The designer's pale text colors have contrast ratios below accessible text thresholds in several places. These are unchanged source choices, not implementation color drift. They are an **open accessibility design decision before public release**. See the measured ratios and W3C reference in [the source study](research/design/2026-11-16-homepage-source-study.md#contrast-finding-for-design-review). Accessible names and semantic headings do not make low-contrast visual text compliant.

Weather is sample content, statistics lack citations/reference dates, the craft caption appears unfinished, and complete English editorial artwork/copy was not supplied. Those facts are recorded in the source study. Dynamic date, an expanded menu, keyboard/focus states and mobile reflow are intentional implementation additions.

Safari, Firefox, physical-device gestures, screen-reader audio output and authenticated account flows were not verified. Touch results are browser emulation. The existing map received a navigation/mount regression check, not another exhaustive routing calibration audit.

## Validation and handoff checklist

- [x] Supplied files personally read; all four artboards inspected.
- [x] Real vector assets extracted with source hash and coordinates.
- [x] Full and focused source/implementation comparisons reviewed after fixes.
- [x] Desktop, tablet and mobile layout captures inspected.
- [x] Navigation, search, menu, locale, keyboard, touch and reduced-motion checks.
- [x] Formatting of changed supported files, lint, TypeScript and production build.
- [x] Existing 38 tests passed, including map reference geometry.
- [x] SPEC SHA256 unchanged: `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
- [x] No package/lockfile changes, commit, push or deployment.
- [ ] Designer/owner review of mobile adaptation, source contrast, weather, statistics and final editorial copy.

Tests used explicit file enumeration on Windows because the existing single-quoted `pnpm test` glob is not expanded correctly by the Windows command shell. The production build generated 61 pages and reported 105 untranslated fields across the dataset, which use the established fallback. Formatting results are scoped to changed files; the repository also has pre-existing CRLF-versus-LF formatting differences.
