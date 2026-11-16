# Homepage source study — 16 November 2026

Read alongside [the implementation plan](../../docs/plans/2026-11-16-homepage-design.md), [asset manifest](homepage-asset-manifest.json), and [visual/interaction QA](../../design-qa.md). All source reading, measurements and visual review were performed by the primary agent; no reading was delegated.

## What was supplied and what each file means

Source directory: `D:/XMAI GRAD/workspace/File`.

| Source                     | Dimensions in artboard units | Meaning                                                            |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `SVG/WEB-01.svg`           | 1922.42 × 1080               | Navy opening screen, the first section of the homepage             |
| `SVG/WEB-02.svg`           | 1920 × 5400                  | Complete desktop homepage; implementation target                   |
| `SVG/WEB-03.svg`           | 560.05 × 480.45              | Palette, usage percentages and tint ramps                          |
| `SVG/WEB-04.svg`           | 1935.03 × 1368.82            | Logo variants, motif system, type and component experiments        |
| `PDF/WEB.pdf`              | Four corresponding pages     | Visual cross-check and limited live-font metadata; 3,080,554 bytes |
| `Adobe Illustrator/WEB.ai` | Four PDF-compatible pages    | Editable master with a readable PDF presentation; 3,082,459 bytes  |

Every file was parsed and rendered. All four artboards were visually reviewed, with enlarged crops of the small Vietnamese copy and motif labels. The PDF and AI previews of the first three pages match; the fourth has presentation differences and was inspected separately. The SVG homepage is the reference for actual colors and geometry.

### Best format for future agent work

Supply **SVG plus PDF**, and retain the AI master for the designer. SVG gives exact paths, fills, strokes, grouping and viewBox coordinates. PDF is a useful visual reference and can expose live text/font metadata. AI is useful here because it was saved with PDF compatibility; arbitrary AI files are not guaranteed to be equally readable.

This export outlines almost all text. WEB-02 has 1,025 paths and no live SVG text. Its PDF only exposes “Từ 2019” as live InterVariable at 18 units. Outlined text preserves appearance but loses editable text, font-size and weight information. The asset library exposes InterVariable, Phudu-Light and SpaceGrotesk-Bold; that does not prove every outlined heading uses those exact weights. Existing Phudu and Inter were compared visually for ordinary HTML text. Customized roof/star letterforms remain original vector assets, paired with semantic text.

For later exports, ask the designer to include a live-text copy, font names/weights, named layers, mobile artboards, hover/focus states, and the intended destination of each control. A PDF alone cannot resolve those interaction decisions.

## Units and geometry

The reference is a 1920-unit-wide artboard. At a 1920 CSS-pixel viewport, this implementation maps one artboard unit to one CSS pixel. **This does not mean CSS `pt` equals CSS `px`.** CSS defines 1pt as 1/72 inch and 1px as 1/96 inch, so using literal CSS `pt` would enlarge these measurements by 4/3. [W3C absolute units](https://www.w3.org/TR/css-values-4/#absolute-lengths).

The page fills its available width without a 1920px cap or outer side gutters, following the owner's correction. Desktop geometry scales proportionally using container width, including screens wider than 1920px. At 1000px and below it reflows into a readable mobile layout. There is no supplied mobile target. The 180-unit desktop margin is part of the lime frame, not a generic site gutter; that drawn frame remains.

WEB-01 fills the initial viewport with `#0d1855` and its exact centered vector lockup. It is a normal first section, not a timed loader: scroll into WEB-02 or activate the logo to focus its header. The keyboard skip link can bypass it. At 1920 × 1080 the logo renders at X=774.625, Y=402.891, width=370.734, height=274.219. Narrow screens use a readable 220px minimum logo width. The geometry table below is relative to WEB-02, after the opening screen.

| Region                  | Source top Y | Source height | Notes                                                                   |
| ----------------------- | -----------: | ------------: | ----------------------------------------------------------------------- |
| Header                  |            0 |           180 | Weather/date left; centered logo; concave search right                  |
| Navigation              |          180 |         77.96 | Five links, pale blue band                                              |
| Hero                    |       257.96 |        880.54 | Architecture, custom title and tagline                                  |
| Connections/intro       |      1138.50 |       1021.67 | Wide title; red woven arches; intro and join link                       |
| Cultural infrastructure |      2160.17 |        256.42 | 83 libraries, 48 universities, 18 theatres, 43 cinemas                  |
| State/artists/public    |      2416.59 |        823.41 | Three ascending architectural groups; artwork overlaps the next section |
| Heritage manifesto      |         3240 |       1076.66 | Four-line statement, two copy columns, four metrics                     |
| Three threads           |      4316.66 |       1083.34 | Place, taste and craft symbols plus map link                            |

The content spans X=180 to X=1740 (1560 units). Major source bounds:

| Element               |       X |       Y |   Width | Height |
| --------------------- | ------: | ------: | ------: | -----: |
| Logo                  |  860.22 |   45.73 |  198.87 |  85.83 |
| Main title            |  477.02 |  380.52 |  948.78 | 158.70 |
| Tagline               |  933.65 |  613.36 |  491.58 |  37.95 |
| Connections title     |  222.93 | 1189.28 | 1483.31 |  78.50 |
| Red illustration      |  567.24 | 1319.87 |  785.10 | 783.97 |
| Intro copy            | 1395.86 | 1640.98 |  300.75 | 228.66 |
| Heritage statement    |  632.22 | 3402.19 | 1022.43 | 325.70 |
| Three-threads heading |  223.74 | 4457.30 |  480.01 | 134.60 |

The manifest records every extracted asset's exact bounds and source-node indices. Do not “tidy” the irregular overlapping arrangement into uniform cards: its asymmetry is intentional. No footer or event cards appear in this homepage artboard. Those destinations remain in navigation; other routes keep the existing frame.

## Colors: palette labels versus actual artwork

WEB-03 retains the original usage guidance: navy 20%, seashell 40%, cyan and light blue 10% each, red/gold/lime/mauve 5% each. The shade strip is a palette supplement, not another set of usage percentages. Do not infer usage ratios by measuring the area of the entire palette board.

| Family     | Base and labeled lighter shades            |
| ---------- | ------------------------------------------ |
| Navy       | `#0d1855`, `#273991`, `#394fa0`, `#5c76ba` |
| Light blue | `#9ceaff`, `#baf0ff`, `#cdf4ff`, `#e1f9ff` |
| Cyan       | `#008b86`, `#4daeab`, `#7fc5c2`, `#b2dcda` |
| Lime       | `#cbdb2b`, `#dbe66b`, `#e5ed95`, `#eff4bf` |
| Mauve      | `#dbb8ff`, `#e6cdff`, `#eddbff`, `#f4eaff` |
| Red        | `#b7262a`, `#cd686a`, `#db9294`, `#e9bdbf` |
| Gold       | `#fec35a`, `#fed58c`, `#fee1ac`, `#fff1e2` |

The **homepage itself** adds `#69dfff` (bright blue), `#ffb126` (amber), `#c1d300` (saturated lime), and `#c68fff` (stronger mauve). It uses **`#fff8f5`** as its paper, although WEB-03 labels **`#fff6f1`**. The artwork also contains variants such as `#ffd58b`, `#445ab5`, `#7486c6` and `#9e2024`. WEB-04 includes near-duplicates such as `#b6262a` and `#cada2c`; they must not silently redefine the homepage colors.

Implementation: new HTML colors are scoped to `page.module.css`; exported vectors keep their original fills and opacity. Existing global colors and map layer colors were not remapped. A site-wide shade-token migration should be a separate deliberate step after the designer resolves these differences.

### Contrast finding for design review

Computed against the homepage paper, bright blue is approximately 1.47:1, amber 1.73:1, saturated lime 1.59:1 and strong mauve 2.28:1. Some supplied text colors therefore fall below even the 3:1 large-text threshold. Cyan is about 3.97:1 (below 4.5:1 for ordinary text); navy is about 15.64:1. These are source-design limitations, preserved for this fidelity-first implementation. Semantic text and keyboard support do not fix visual contrast. **Do not call this page WCAG AA compliant.** [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

A future accessible color variant should retain pale colors for decoration and use approved darker text shades. That changes the supplied design and should be reviewed visibly, rather than being silently substituted during implementation.

## The symbols have meanings

WEB-04 explicitly associates the navy/lime pair with **Địa**, gold/red with **Vị**, and cyan/mauve roof pair with **Nghề**. Stacked blue roofs mean **giao thoa**; the blue star marks **điều ít người biết**; the lime marker means **định vị**; the folded cyan shape means **map**. Additional variants are labeled **bệ phóng**, **kết nối**, **chứng nhận**, WC and stairs.

Reuse these associations on later pages. Do not replace them with generic pin, hamburger or circular-card graphics just because those are easier to implement. The white roof mark is used as the homepage's menu trigger; the reference does not supply its expanded state, so that dialog is an implementation decision.

## Content and interaction decisions

- New editorial copy and artwork metadata live in `data/home.yaml`, loaded and validated through `src/content/`. UI strings are in both locale dictionaries.
- “30°C” is the reference sample. The accessible name and tooltip identify it as sample weather; there is no weather API. The date uses the current day in `Asia/Ho_Chi_Minh`, not the placeholder `dd / mm / yy`.
- All eight statistics are transcribed from the design, not independently verified facts. Confirm their sources, dates and the meaning of “Từ 2019” before publication.
- The craft caption is exactly the source's apparently unfinished “Làng nghề vẫn sống trong lòng”. Do not complete it by inventing copy. The place caption says “Năm nơi”; the current place dataset has five entries, but future data changes should prompt a copy review.
- No English editorial artboard was supplied. New controls have English labels; supplied editorial wording and decorative Vietnamese lettering use the project's Vietnamese fallback. Full translation remains editorial work, including a possible alternate vector lockup.
- Search uses the actual point catalogue and existing accent-insensitive search. Results are real links, with empty, keyboard and Escape states.
- The three motif links open `/[lang]/explore?layer=place|taste|craft`; Explore validates the value, defaults to Place, and exposes the selected category immediately. Tab/panel IDs are scoped per mounted instance to accommodate retained locale pages.
- Menu exposes main destinations, account and locale links. Native dialog semantics plus an explicit Tab boundary keep focus within the menu; Escape/close restores the trigger.
- The home frame is selected through the active Next.js layout segment. Avoid CSS that detects the presence of a homepage descendant: Next can retain a hidden previous page during navigation.
- The skip target is locale-scoped; search/menu IDs are instance-scoped. Repeated VI/EN navigation was tested for duplicate DOM IDs.
- No new animation or app dependency was introduced. Reduced-motion mode has no homepage animations. The map, its artwork calibration, points and saved routes were preserved.

## Reusing the extracted art

`public/home/` contains 27 source-derived SVGs, about 161KB uncompressed in total, including the opening lockup. This is not a raster screenshot of the page. Decorative lettering is paired with semantic headings; paragraphs, counts, links, search and menu remain HTML. Images retain intrinsic dimensions to reduce layout shifts. At narrow widths the connections heading becomes readable HTML instead of shrinking the full-width decorative line.

`scripts/extract-home-art.py` is standard-library Python. Run it with the path to WEB-02.svg; it finds WEB-01.svg beside it or accepts its path as a second argument. It verifies both source SHA256 values, retains the selected nodes and their styles, and records coordinates in `homepage-asset-manifest.json`. Original paint order is preserved. The search outline adapts to the mobile input while retaining its desktop dimensions.

Opening SVG source SHA256: `7ce0d495bff45626f7ba0e278082d18321b486d4700ccc499bfda18fe4c20097`.

Homepage SVG source SHA256:
`5c6622fd682e1803419d0d19efe73295a9f2504bd529dc2130bdbb43cdaa7e6c`.

AI master SHA256:
`ce38ac14dfb975a75710c6e5a50bec9a6cc26408f32f62784dc8397f2445fa17`.

The raw source exports remain outside the Git project. The runtime assets, manifest, notes and QA comparisons are reviewable in the project. No commit or push was requested.

## Next work

Review this first implementation with the designer at 1920px, then approve the mobile adaptation and menu behavior. Resolve the paper/shade naming differences, contrast, source statistics, weather behavior and unfinished craft caption. Supply the next page's artboard before extending this frame across other routes. Keep SPEC reconciliation separate under the owner's instruction; its bytes were preserved during this work.
