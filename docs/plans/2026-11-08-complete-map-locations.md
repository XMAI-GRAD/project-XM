# Complete the 12 map locations

## Scope

Populate the canonical `data/points/place.yaml`, `taste.yaml` and `craft.yaml` entries from the owner's 7 November 2026 content PDF: five PLACE, four TASTE and three CRAFT locations. Preserve the existing map artwork, calibration and source-backed positions. Keep SPEC.md unchanged; its starting SHA-256 is `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.

The working tree already contains the merge repair restoring `readFileSync` in `src/content/index.ts`. Preserve it. Do not commit or push.

## Method

1. Read all 12 PDF pages; visually check the destination pages (5–9) and English appendix (12).
2. Copy the nine missing entries and restore the complete nearby relationships in the three seeded entries. Keep blank nearby lists where the source supplies no named destination. Distances are editorial values from the PDF, not calculated routes.
3. Use only appendix-supplied English copy; retain the existing Vietnamese fallback for untranslated prose. Keep new images empty until real assets are supplied; use the map's existing code/category fallback.
4. Verify public geographic references. Distinguish visitor entrances, business pins and representative points for districts, villages or landmarks. Record source URLs and limitations; derive pixels from the existing calibration rather than authoring display coordinates.
5. Check all destinations against the artwork bounds. Keep any genuinely off-artwork location in the list without moving its coordinates to force a pin.
6. Validate content, links, language switching, multi-pin selection/search, responsive layout and the production build. Record actual results and remaining editorial/asset work.

## Source caveats

The PDF marks several hours/prices with `[GĐ]`. Preserve their provisional status in field comments and the provenance notes; source ingestion is not a claim that these are current operational facts. Historical/editorial copy is copied from the supplied document, not independently fact-checked. Map coordinates and geographic identities are researched separately. No routing service or runtime map API is added.

## Completed

- Added the nine missing entries and completed the nearby links in the three seeds. Counts are now **5 PLACE / 4 TASTE / 3 CRAFT**, with all four food seasons represented and 20 named nearby links.
- The nine new hooks, stories and facts were checked programmatically against the extracted PDF text, after the declared whitespace/quote normalization. English names and dish labels come only from the appendix; remaining prose uses the existing Vietnamese fallback.
- All 12 locations have source-backed coordinates and project inside the artwork. The existing three placements, original artwork and calibration values are unchanged. New references include explicit entrance/business/representative kinds and bilingual descriptions; see [the source register](../map-locations/README.md).
- New photos remain `images: []`, using existing UI fallbacks. The three existing cover placeholders were retained. There are no new application dependencies or runtime map services.
- Regenerated the calibration HTML/PNG for all 12 destinations, using code labels to avoid long place-name collisions. The CLI generator's direct Node import had become incompatible with the merged Turbopack-only YAML glob; the new documentation-only `load-content.mjs` adapter lets it run the same `src/content/` validation without changing the app's loader. The generated image was visually inspected. Original fit metrics remain RMS 1.64 px / maximum 2.13 px at the original check junctions.

## Validation on 8 November 2026

- Data audit passed: all 12 PDF codes, 5/4/3 counts, unique slugs, four food seasons, all 12 in bounds, 20 valid nearby links, nine source-text matches, nine coordinate/source matches and unchanged SPEC bytes.
- Browser checks passed using installed Edge 157.0.4341.42 with temporary Playwright tooling against localhost:3000. In both languages: correct layer/list/pin counts, all 12 list-to-card selections, selected-pin state, code search, correct localized detail links, absent-image fallbacks, locate and Escape focus restoration. Keyboard pin activation and close-focus restoration passed for each layer.
- Real multi-pin layers had no overlapping button bounds at the tested overview. The selected Vạn Phúc pin stayed clear of the card at 390, 320 and 1440 pixel viewport widths; no horizontal overflow was detected. Desktop overview and narrow-card screenshots were visually inspected.
- Four further language switches passed exact search-name and unique-ID/ARIA ownership checks. The interaction context reported no console errors or uncaught page errors.
- All 24 localized detail routes returned HTTP 200 with the expected heading and localized nearby links. The sitemap includes all 24 location URLs.
- `pnpm lint`, `pnpm typecheck`, all **23 existing tests**, changed-file Prettier checks and `pnpm build` passed. Build generated **58 static pages** and reported **95 untranslated fields**, using the existing fallback. On Windows, tests were run with explicit file arguments obtained from `rg --files src -g '*.test.ts'`, because the existing package script's quoted glob had discovered zero tests.
- `SPEC.md` remains byte-for-byte equal to the task-start snapshot (SHA-256 above). Existing `readFileSync` merge repair is preserved. No commit or push was performed.

Local diagnostic evidence is outside Git in `D:\XMAI GRAD\tmp\pdfs\hanoi-content\data-audit.json` and `D:\XMAI GRAD\tmp\map-step5-qa\dataset-browser.json` / `dataset-details.json`. This plan and the source register are the durable repository record. Temporary PDF/browser packages were installed outside the repository, not added to package.json or the lockfile.

## Remaining limits

- Photographs/audio and untranslated editorial prose still need supplied assets/copy. Most PDF `[GĐ]` hours/prices are not current verified operational data. Nearby distances remain source-document approximations.
- A village, district, bridge footprint or exhibition landmark is not automatically a walkable entrance. Route endpoints and road alignment need a separate check before A-to-B routing. Vạn Phúc is inside the image but outside the original control-point footprint; the old check-point error is not a guarantee for that destination.
- This data-only browser pass did not repeat physical-touch, screen-reader or full accessibility audits. Step 5's earlier emulated motion/touch results remain historical evidence, not newly rerun checks.
- Full-repository formatting was not repeated. The merge review had identified 69 unrelated files whose warnings were solely Windows CRLF endings; this task formats only its changed files. The image generator emitted nonfatal font-cache-directory warnings; its generated output was inspected.
