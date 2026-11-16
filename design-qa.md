# Homepage design QA — 16 November 2026

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
