# Places: ĐỊA point detail from the designer comps — design

Date: 2026-11-19. Status: draft, awaiting review. Issue: #40 (and the ĐỊA part of #44). Owner: Sơn (Places).

## Intent

The team split the site by owner: Map → Minh, Home and About → TE, Places (Explore and the point pages) → Sơn. Places starts with the ĐỊA layer, because its comps are the only ones ready. The designer sent six comps for it:

| PDF page | Source SVG      | Screen                                        |
| -------- | --------------- | --------------------------------------------- |
| 1        | `ĐỊA.svg`       | Explore, ĐỊA slide (already built by TE, #62) |
| 2        | `VĂN MIẾU.svg`  | `d02` van-mieu-quoc-tu-giam                   |
| 3        | `HỒ GƯƠM.svg`   | `d03` ho-hoan-kiem-den-ngoc-son               |
| 4        | `36.svg`        | `d04` pho-co-36-pho-phuong                    |
| 5        | `LONG BIÊN.svg` | `d05` cau-long-bien                           |
| 6        | `HTTL.svg`      | `d01` hoang-thanh-thang-long                  |

The assets live outside the repo, in `XMAI-GRAD/Assets/ĐỊA/` (2.7 GB). `ĐỊA FULL.pdf` holds all six pages, with text outlined and no text layer. The designer says some SVGs have a broken headline font, and to take headlines from the PDF.

**Goal:** the five ĐỊA point pages match their comps on desktop (1920 wide), and they carry real photos.

**Success:** at 1920 × 1080, each point page reads as its comp, side by side. The favorite, comments, audio and directions tools still work, placed into that layout. The explore ĐỊA slide shows the five real photos in its gates.

## Goals, non-goals, anti-goals

- **Goals:**
  - A new point detail layout from the comps: info row, headline with drawn letters, hook, price and address row, photo, story, fact, nearby, then the layer's other points.
  - Real photos for the five ĐỊA points, from the comps.
  - The interaction tools stay: favorite, stat counts, comments, audio, directions. The designer forgot to draw them and asked to keep all of them.
- **Non-goals:**
  - VỊ and NGHỀ comps. Their pages use this layout until their comps arrive.
  - Mobile layouts (after 2026-11-23, #45).
  - New features, DB or API changes.
- **Anti-goals (a failure even if it works):**
  - A headline drawn as an image or as outlined paths. It must stay real text, so it is accessible, searchable, and has an English version.
  - Text that overlaps or clips when a story, hook or headline is longer than in the comp.
  - Re-running the home art extraction and wiping `src/features/home/art/` (see Art pieces).

## Approaches

**Layout.** Two ways were considered.

- **A. Absolute comp coordinates**, as home and the explore slide do: a fixed `--board` of 2348, and every element placed with `.at` at its comp position.
  - Pro: pixel match with the comp; the same system as the explore slide.
  - Con: the five points have different text lengths. The story runs 4–9 lines, the headline 1–2 lines, and the hook 1–3 lines, and English differs again. Every point would need its own coordinates, or text would overlap.
- **B. The board frame with a flowing grid (picked).** The page keeps home's header, frame and comp unit `--u`: every size, font size and gap is measured from the comp in comp units. The content flows in a CSS grid, so longer text pushes what follows down.
  - Pro: one layout serves all five points, VỊ and NGHỀ later, and English.
  - Con: a few pixels off where a text is longer than in the comp. The board's height becomes "at least the comp's".

Sơn picked B.

**Headline.** The headline is Phudu, uppercase, with up to two letters the designer drew: a roof-shaped A (with the accent of the word: À, Ă, Ầ) and a four-petal O. These are the same drawings as home's `glyph-hero-a` and `glyph-hero-o`, recolored, and with other accents.

- **Picked:** live text, through the existing marks of `src/features/home/rich-text.tsx` (`{glyph-name:letter}`) and `glyphs.ts`. Only the drawn letters come from the comp as art. The broken headline font in the SVGs doesn't matter: no headline outline is used.
- **Rejected:** the headline as vector art from the PDF. It looks exact, but it has no English, no selection, and no accessible name, and it needs a new export per point.

**Art extraction.** The designer's drawings (glyphs and icons) come out through `scripts/home-art/extract.mjs`, as for home.

- **Picked:** a separate manifest for Places, writing to `src/features/explore/art/`. The script is changed to take the manifest and the output folder as arguments.
  - Why: `extract.mjs` re-extracts every source in its manifest and first empties its output folder (lines 307–310). This machine lacks `WEB-05`, `WEB-06` and `WEB-07` (TE has them), so running the home manifest would delete the home and about art.
  - The script already strips embedded photos before Chrome parses an SVG, so the 140 MB exports are workable.
- **Rejected:** adding the pieces to the home manifest. It needs TE's missing exports, and it risks overwriting home art.

## Design

### Route and frame

- Move `src/app/[lang]/(site)/explore/[slug]/` to `src/app/[lang]/explore/[slug]/`, next to the explore page. The `(site)` group wraps pages in the old navy-rail frame; the comps use home's frame.
- The page renders like the explore page: `.home` > `.board` with `<HomeHeader current="explore" />`, `<main>`, `<Frame />`, then `<SiteFooter />`.
- `.board` gets a height that is at least the comp's (2348) and grows with content. The frame art is drawn 5400 tall and is cropped to the board, so a taller page still has its frame.
- Keep `instant = false`, `generateStaticParams` and `generateMetadata` as they are.
- **404 check:** after the move, the page is no longer under `(site)`, so `(site)/not-found.tsx` is not its boundary. An unknown slug must still show the localized 404 (SPEC Part 1). Read `node_modules/next/dist/docs/` on `not-found` and add the boundary the docs call for.
- `point-motion.tsx` moves with the page and imports `motionAllowed` from `@/app/[lang]/(site)/explore/explore-motion` (as the login slideshow does).

### Page layout (comp units, 1920 wide)

All values come from the comp, in comp units (`calc(N * var(--u))`). The numbers below are approximate, measured from the PDF renders. Take exact values from `HỒ GƯƠM.svg` in the browser.

```
x: 280                 700                 1196               1500       1690
   ┌──────────────────────────────────────────────────────────────────────┐
   │ NĂM 1070           DI TÍCH QUỐC GIA…   8H00 - 17H00       NGHỈ THỨ HAI │  info row (y≈330)
   │                                                                      │
   │ VĂN MIẾU                               " HIỀN TÀI LÀ NGUYÊN KHÍ…  "  │  headline + hook (y≈420)
   │       – QUỐC TỬ GIÁM                                                 │
   │ 70.000 VNĐ         58 QUỐC TỬ GIÁM  CHỈ ĐƯỜNG →   ♡ 12 · 💬 3        │  price row (y≈600)
   │ ┌──────────────────────────────┐   story (bold runs)…                │
   │ │ photo 883 × 546              │   [audio player, when present]      │  y 646–1192
   │ │                              │        ✦ Điều ít người biết: …      │
   │ │ ⌂ (mark)                     │   Gần đây: Hoàng thành (1,2 km) · … │
   │ └──────────────────────────────┘                                     │
   │ ⌂ ĐỊA                                                                │  y≈1310
   │           [gate]                         [gate]                      │  the layer's other
   │           [gate]                         [gate]                      │  points, 2 × 2
   │ ─ comments ───────────────────────────────────────────────────────── │
   └──────────────────────────────────────────────────────────────────────┘
```

1. **Info row.** One cell per value, no visible labels. Each `<dt>` stays, visually hidden, for screen readers. Uppercase Inter, navy-400, as in the comp.
   - Place: `since` · `kind` · each line of `hours` (split on `" / "`, as the current `Lines` does).
   - Taste: dish · `since` · hours · season.
   - Craft: craft · hours.
   - Price moves to the price row for every layer, so it never shows twice. VỊ and NGHỀ keep these cells until their comps arrive.
2. **Headline.** `<h1>` in Phudu, uppercase, navy-500, rendered by `RichText` from `headline` (below), with drawn letters. Lines break where the YAML breaks. Lines after the first are indented by `headlineIndent` comp units.
   - Register each drawn letter in `glyphs.ts` with the baseline and cap height of the line it sits on in its source SVG.
3. **Hook.** In the right column, aligned to the headline's top. Phudu, uppercase, in the layer's accent, set per layer on `data-layer`: ĐỊA is lime, as on the explore slide; VỊ and NGHỀ stay navy until their comps arrive. It is wrapped in “ ” drawn by CSS, and breaks on `" / "`.
4. **Price row.**
   - `price` (when the point has one) · `address` + **directions** link (`CHỈ ĐƯỜNG →`, same style as the row; target unchanged: `/[lang]/maps?to=<slug>`).
   - In the right column: the **favorite** button and **stat counts** (favorites · comments), in their existing `Suspense` and `ErrorBoundary` holes.
5. **Photo.** `images[0]`, `next/image` with `fill`, cover, in an 883 × 546 box. The drawn layer mark sits on its bottom-left corner, as in the comp. No photo yet (VỊ, NGHỀ): the current skeleton with the "Image" chip.
6. **Right column.**
   - **Story:** paragraphs rendered with `RichText`, so `{b:…}` marks show bold, as in the comp.
   - **Audio:** the existing `<audio>` block, after the story, only when `point.audio` exists. No point has audio today, so nothing renders yet.
   - **Fact:** indented, with the drawn four-petal mark and the bold label "Điều ít người biết:" (`point.fact` key).
   - **Nearby:** one line, bottom-aligned with the photo: bold "Gần đây:" (`point.nearby` key), then `shortName (1,2 km)` links joined by `" · "`. Distances use one decimal (`1,0 km`), in the page's locale.
7. **Layer section.** The drawn layer mark (ĐỊA only, until the other layers have theirs) + the layer name (`layers[layer]`). Then the layer's other points as gates in a 2 × 2 grid, reusing `PointCard` from `src/features/explore/point-card.tsx`.
8. **Comments.** The existing `Comments` component, last in the board, across the content width (280–1690). It is restyled to the comp's type scale, with its heading set like the layer heading.

**Dropped from the current page** (the comp has no place for them):

- The "← Khám phá" back link: the header nav already links to explore.
- `StickyName`: the header stays on screen.

### Content model (`src/content/`, `data/`)

Add to the `Point` interface in `src/content/index.ts` (one interface for all layers), all optional:

```ts
headline?: Localized;    // the display headline: marks for drawn letters, "\n" between lines.
                         // Falls back to `name` when absent.
headlineIndent?: number; // comp units; indents every headline line after the first.
shortName?: Localized;   // the name in "Nearby" lines ("Hoàng thành"). Falls back to `name`.
```

- The loader copies empty `en` fields from `vi`. So write `headline.en` and `shortName.en` for the five places: a Vietnamese headline must not show on English pages.
- **`RichText` gets a `{b:…}` mark** that renders `<strong>`. `plain()` already reduces any mark to its letters.
- `RichText`'s unknown-mark error names `data/home.yaml`. Make it name no file, since points use it too.
- **`glyphs.ts`** merges the explore art pieces with home's, and registers the ĐỊA headline line (baseline and cap height from the comp) for the new glyphs.
- **`data/points/place.yaml`:**
  - add `headline`, `headlineIndent`, `shortName`, and `{b:…}` marks in `story` where the comp bolds;
  - set display text to the comp (table below);
  - point `images` at the real photos.
- Taste and craft points need no `shortName`: their names already match the comp's nearby text.

**Display text: comp vs YAML.** The comp wins: it is the designer's latest. The PR lists these changes for the designer to confirm.

| Point | Field | YAML now                                          | Comp                           |
| ----- | ----- | ------------------------------------------------- | ------------------------------ |
| d01   | since | Thế kỷ 11                                         | Thế kỉ XI                      |
| d01   | kind  | Di sản Thế giới được công nhận                    | Di sản thế giới                |
| d01   | hours | 8H00-17H00 / (các ngày trong tuần, trừ Thứ Hai)   | 8H00 - 17H00 / Nghỉ thứ Hai    |
| d01–2 | price | 70.000 đ                                          | 70.000 VNĐ                     |
| d02   | since | 1070                                              | Năm 1070                       |
| d02   | hours | 8H00-17H00 / (các ngày trong tuần)                | 8H00 - 17H00                   |
| d03   | hours | Hồ Hoàn Kiếm: 24/7 / Đền Ngọc Sơn: 7H00-18H00 / … | 7H00 - 18H00                   |
| d03   | price | Hồ Hoàn Kiếm: Miễn phí / Đền Ngọc Sơn: 50.000 đ   | 50.000 VNĐ                     |
| d03   | since | Thế kỷ 15                                         | Thế kỉ 15 (d04 uses XV)        |
| d04   | since | Thế kỷ 15                                         | Thế kỉ XV                      |
| d04–5 | hours | 24/7                                              | Mở cửa cả ngày                 |
| d04–5 | price | Miễn phí                                          | Tham quan miễn phí             |
| d04   | hook  | Ba mươi sáu phố rành rành chẳng sai.              | Ba sáu phố rành rành chẳng sai |
| d05   | since | 1903                                              | Năm 1903                       |

Two of these lose information or are inconsistent; flag them in the PR:

- d03 drops "the lake is free, open 24/7".
- d03 writes "15" while d01 and d04 use Roman numerals.

Headlines, as the comp sets them (`{…}` = a drawn letter; line 2 indent in comp units, approximate):

| Point | Headline                        | Indent |
| ----- | ------------------------------- | ------ |
| d01   | Ho{À}ng thành / Thăng L{O}ng    | ~195   |
| d02   | V{Ă}n Miếu / – Quốc Tử Giám     | ~140   |
| d03   | Hồ Ho{À}n Kiếm / – Đền Ngọc Sơn | ~355   |
| d04   | Phố cổ / – 36 phố phường        | 0      |
| d05   | C{Ầ}u Long Biên                 | —      |

### Art pieces (`src/features/explore/art/`)

- **New manifest:** `scripts/home-art/places.mjs`. **Script change:** `extract.mjs` takes the manifest and the output folder as arguments, defaulting to today's (`manifest.mjs`, `src/features/home/art/`).
  - Run it on the asset folder outside the repo: raw exports never go in the repo (SPEC Part 3), and they exceed GitHub's 100 MB limit.
- **Pieces**, found by child-index path in the browser, as for home:

  | Piece         | What                                | Source          |
  | ------------- | ----------------------------------- | --------------- |
  | `dia-a-grave` | roof A with À                       | `HỒ GƯƠM.svg`   |
  | `dia-a-breve` | roof A with Ă                       | `VĂN MIẾU.svg`  |
  | `dia-a-circ`  | roof A with Ầ                       | `LONG BIÊN.svg` |
  | `dia-o`       | four-petal O                        | `HTTL.svg`      |
  | `place-mark`  | the layer mark beside "ĐỊA"         | `HỒ GƯƠM.svg`   |
  | `photo-mark`  | the white mark on the photo corner  | `HỒ GƯƠM.svg`   |
  | `fact-mark`   | the four-petal mark beside the fact | `HỒ GƯƠM.svg`   |

- **If a glyph in an SVG is broken** (the designer's warning), check it against the PDF render of the same page. Then, in order:
  1. Take it from another ĐỊA SVG that has it.
  2. For À, reuse `glyph-hero-a`, recolored.
  3. Export that page of the PDF to SVG (`pdftocairo -svg`, from `brew install poppler`) and extract the path from it.

### Photos (`public/points/<slug>/`)

- **Source:** `ĐỊA.svg` embeds the five originals:
  - three landscape: 6000 × 4000 JPEG, 6249 × 4166 PNG, 3054 × 2048 PNG;
  - two portrait: 4012 × 5690 PNG, 4151 × 6244 PNG.
  - Match each photo to its point by eye.
- **Export:** JPEG, 2400 px on the long edge, under 1 MB each (SPEC Part 3), e.g. `sips -Z 2400 -s format jpeg -s formatOptions 80`. Save as `public/points/<slug>/cover.jpg`.
- **YAML:** record `width`, `height` and `alt { vi, en }`, with no `temporary` flag. Delete the old placeholder `public/points/hoang-thanh-thang-long/cover.png`.
- **Crop:** the photo box is landscape, so the portrait photos crop to its center. If a crop misses the comp, add an optional `position` (CSS `object-position`) to `Photo`. Don't add it before.
- The explore ĐỊA slide then shows the photos in its gates with no code change: `PointCard` skips `temporary` images only.

### Motion

Reuse `PointMotion` and its hooks:

- On arrival: the photo settles (`data-media`); the headline, hook and price row reveal (`data-reveal`); the info cells unroll (`data-cell`).
- Below the fold: the story, fact, nearby and gates wipe or unroll (`data-wipe`, `data-unroll`).

It already respects `prefers-reduced-motion` through `motionAllowed`. No new animation library.

### SPEC.md changes (same PR)

- **Part 1, Screens, Point detail:** the new order. Info row · headline · hook · price and address with directions, favorite and counts · photo · story · audio · fact · nearby · the layer's other points · comments. No back link.
- **Part 2, Points:**
  - add `headline`, `headlineIndent` and `shortName`, and the `{glyph-…:x}` and `{b:…}` marks;
  - bring the block in line with the code it documents (`since` and `kind` on the base, `mapLocation`, `Photo.temporary`).

## Left to the builder

- Exact comp measurements, font sizes and colors, from `HỒ GƯƠM.svg` in the browser.
- The child-index paths of the art pieces.
- The `alt` text of the photos, `headline.en` and `shortName.en`, from the English names already in the YAML.
- The comments restyle, inside the comp's type scale and colors.
- The 404 boundary the Next docs call for, after the route move.

## Calls made in this design (check while reading)

1. The new layout serves all 12 points; VỊ and NGHỀ adapt when their comps arrive.
2. Tool placement:
   - directions after the address;
   - favorite and counts in the price row's right column;
   - audio after the story;
   - comments last, after the layer's other points.
3. The back link and `StickyName` are dropped.
4. Comp text wins over the YAML; the PR lists the diffs for the designer.
5. New optional fields `headline`, `headlineIndent` and `shortName`, instead of marks inside `name`, because `name` feeds search, cards, maps and metadata.
6. Art goes to its own folder through a second manifest, so home's art is never regenerated from here.
