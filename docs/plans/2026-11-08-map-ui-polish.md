# Map interface polish — 8 November 2026

Step 5 uses the three existing content entries and calibrated artwork. SPEC.md stays unchanged at the user's request; remaining content and route overlays are separate work.

- Keep selected pins clear of the actual card bounds, including after resizing.
- Separate overlapping pin buttons with leaders to their geographic anchors.
- Dock the detail card below the map when the canvas is narrow; keep its close action accessible while scrolling.
- Improve keyboard focus, touch targets, image fallbacks, loading/error feedback and search recovery in Vietnamese and English.
- Check layout calculations, existing tests, lint, types, production build and both localized routes.
- Attempt browser verification; record any unavailable checks honestly.

Implemented: measured card avoidance, separate pin buttons with leader lines, hover/focus names, a card dock below narrow canvases, persistent close/detail controls, a locate action, search recovery, cover-image fallback, explicit focus restoration and immediate keyboard panning. Layer changes and searches restore the overview; reset also closes the selected card. Palette, geographic data and dependencies are unchanged.

## Follow-up fix and status

Step 5's implementation and supported browser checks are complete as of 8 November 2026. The existing uncommitted work was preserved. Nothing was committed or pushed.

Reviewed the supplied desktop report and candidate patch. The original components used fixed DOM IDs. This project's `cacheComponents` configuration preserves recently visited routes as hidden DOM, as documented by the installed Next.js version and observed in the new browser checks. That makes the reported combined English/Vietnamese search label credible: hidden labels can still refer to the same fixed input ID.

Applied only the candidate's two component changes, adapting formatting; its stale plan/build status was not applied. `MapExplorer` now derives search, hint, locations, canvas, card, card-title and keyboard-help IDs from a React `useId` prefix. Every corresponding label and ARIA reference uses that prefix. `MapCanvas` receives the card/help IDs, including for Leaflet-created pin buttons. No package, lockfile, palette, artwork or coordinate changes were introduced by this follow-up.

## Browser verification

The shared browser connector still reported that its access host was unavailable. Actual browser testing succeeded through temporary Playwright 1.65.0 tooling outside the repository, using installed Microsoft Edge 157.0.4341.42 in isolated headless contexts against `http://localhost:3000/vi/maps` and `/en/maps`. These are browser results, not substitutes based on HTTP status or unit tests.

| Check                           | Actual result                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repeated VI/EN navigation       | Passed five client-side language switches per scenario. Both retained map instances had distinct IDs; the visible search name was exactly `Tìm địa điểm` or `Search places`.                                                                                  |
| Labels and ARIA ownership       | Passed unique-ID and reference checks across visible and hidden maps, including labels, hints, lists, canvas, card titles, keyboard help and Leaflet pins. Card references were checked with cards open; the existing conditional card is absent when closed. |
| Both cached cards open          | Passed another five language switches while leaving each locale's card selected. Both card/title IDs remained unique and references resolved within their own map instance. Escape closed the visible card and restored list-button focus.                    |
| Categories, selection and focus | All three categories in both locales passed list activation with Enter, pin activation with Space, selected-pin state, localized detail links, title focus, Escape and close-button focus restoration.                                                        |
| Search and recovery             | Unaccented name, uppercase address and point-code searches passed. No-match state, clear-to-search focus and retaining a query while changing layers passed.                                                                                                  |
| Responsive layout               | Passed at 1440×1000, 1024×800, 390×844 and 320×720. The selected pin stayed clear of the card, card actions remained visible, and no horizontal document overflow was detected. Desktop and narrow screenshots were visually reviewed.                        |
| Map navigation                  | Mouse drag, locate, reset, arrow-key pan, keyboard +/− zoom, disabled zoom limits and detail-page Back restoration passed. The earlier desktop report also covered Tab traversal and Shift-arrow panning.                                                     |
| Reduced motion                  | Emulated `prefers-reduced-motion: reduce` matched; the tested result-button transition was `0s`, no running animations were reported at the sample, and locate did not enable Leaflet zoom animation.                                                         |
| Cover-image failure             | Aborted image requests produced the designed fallback with an accessible unavailable-image message; card text and detail actions remained usable. The fallback screenshot was reviewed. There is no separate cover retry action to test.                      |
| Map failure and retry           | In both locales, an aborted map load showed the error and disabled zoom. Search/list selection remained usable. A failed retry followed by a successful retry restored the map while preserving the query, selected card and pin references.                  |
| Touch drag and pinch            | Synthetic Chromium touch events moved the artwork with one finger and increased map scale with a two-finger pinch in a 390×844 mobile context.                                                                                                                |

The normal interaction context reported no browser console errors or uncaught page errors. Fault-injection contexts intentionally generated failed network requests.

Local diagnostic scripts, JSON evidence and screenshots are in `D:\XMAI GRAD\tmp\map-step5-qa\` (`verify.cjs`, `verification.json`, `retained-cards.cjs`, `retained-cards.json`). They and the temporary browser-test dependencies are outside Git; the results above are the durable repository record.

## Project validation

- Changed Step 5 files: Prettier check passed after formatting the two patched components and updated documentation.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- All 19 tests passed, including seven layout tests. On this Windows shell, the package script's quoted glob discovered zero tests, so all five existing test files were passed explicitly to Node:

  ```text
  node --experimental-strip-types --test src/features/auth/next-path.test.ts src/features/interactions/comment-input.test.ts src/features/maps/search.test.ts src/features/maps/georeference.test.ts src/features/maps/layout.test.ts
  ```

- `pnpm build`: passed, including TypeScript and generation of 37 static pages. The candidate's earlier Google Fonts download failure did not recur in this working tree. The existing 44 untranslated content fields still fall back to Vietnamese.
- `SPEC.md` remains byte-for-byte identical to the pre-fix snapshot. SHA-256: `ABBE8DA2D051A6E5C77C0C4D77BADF4966D36C1F685340A552A79BEC6FC6BE16`.

Full-repository formatting was not rerun: the previous check reported pre-existing line-ending warnings. Unrelated files were not reformatted. Existing Node module-type warnings during tests did not prevent the 19 tests from running.

## Remaining limitations

- Touch/pinch and reduced motion were emulated, not tested on physical touch hardware or by changing an operating-system preference. No real screen-reader session, cross-browser matrix or full WCAG audit was performed.
- Pin-overlap separation has synthetic geometry-test coverage; current content has only one point per layer, so a real multi-pin dataset still needs visual verification when content is added.
- The existing UI/UX research findings remain follow-up proposals, not claims of resolved accessibility or design issues. They include non-drag pointer panning, hover-label behavior, text contrast and broader focus/camera behavior.
- Nine remaining content entries and in-app A-to-B routing are separate work. Cover assets remain placeholders. This verification does not establish geographic/GPS accuracy or a production deployment result.
