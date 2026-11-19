# Places: ĐỊA point detail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the five ĐỊA point pages match the designer's comps on desktop, keep their favorite, comments, audio and directions tools, and show real photos.

**Architecture:**

- The point page moves out of the old `(site)` rail frame onto home's board frame, like `/explore`.
- Its content flows in a CSS grid sized in comp units (`--u`).
- Headlines are live Phudu text with the designer's drawn letters through the existing `RichText` marks.
- Drawn pieces come out of the comp SVGs through `scripts/home-art/extract.mjs`, with a second manifest and output folder.

**Tech Stack:** Next.js (the repo's version, read `node_modules/next/dist/docs/` first), React, CSS Modules, GSAP via `useGSAP`, YAML content in `data/`, `node --test` for pure logic.

**Spec:** [`docs/plans/2026-11-19-places-dia-design.md`](2026-11-19-places-dia-design.md) (approved 2026-11-19). It holds the layout map, the comp-vs-YAML text table, the headline table and the art piece table. This plan refers to them instead of copying them.

**Assets (outside the repo, never committed):** `XMAI-GRAD/Assets/ĐỊA/`. It holds `ĐỊA FULL.pdf` (6 pages, outlined text) and six SVG exports. Below, `$DIA` is that folder.

## Global Constraints

- **Content and text:**
  - Content is read only through `src/content/`. Never hardcode content text in components.
  - Every UI string goes in both `src/i18n/dictionaries/vi.json` and `en.json`.
- **Motion:** GSAP + ScrollTrigger + Lenis only, via `useGSAP`; every animation respects `prefers-reduced-motion`.
- **Theme:** there is no dark mode.
- **Images:** JPG or PNG at 2400 px on the long edge, under ~1 MB each, in `public/points/<slug>/` with kebab-case names. Record `width`, `height` and `alt { vi, en }` in the YAML.
- **Raw exports:** Figma files and raw exports never go in the repo.
- **Fonts:** Phudu (`--font-display`) for headings, Inter (`--font-body`) for body.
- **Session and DB reads:** read `cookies()`, the session or the DB only inside a Suspense boundary, a Server Action or a Route Handler.
- **Version control:**
  - Use GitButler (`but`), on one branch `40-places-dia` off `dev`.
  - Commits follow `type(scope): one-line summary` and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Open the PR into `dev` with `Closes #40`. Never target `main`; a human merges.
- **Before pushing:** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- **Viewport:** desktop only (comps are 1920 wide); mobile is #45.

## Review Focus

1. **English pages** (`/en/explore/<slug>`): the headline shows the English headline, never the Vietnamese one. Nearby shows English short names. Nothing overlaps with the longer English strings. Pinned in Task 3 step 6 and Task 5 step 8.
2. **The tools still work in their new places:**
   - Signed out, the heart leads to login and back to the same point.
   - Signed in, the heart toggles and the counts update.
   - A comment posts, and its author can delete it.
   - Pinned in Task 5 step 9.
3. **An unknown slug** (`/vi/explore/khong-co`, `/en/explore/nope`) shows the localized 404, not Next's default. Pinned in Task 4 step 4.
4. **VỊ and NGHỀ points** (no headline, no photo, other cells) render on the new layout without errors or overlap, with price shown once. Pinned in Task 5 step 8.
5. **Reduced motion:** with the OS setting on, every block is visible on load, with no element stuck clipped. Pinned in Task 5 step 10.

---

### Task 1: Extract the ĐỊA art pieces

**Files:**

- Modify: `scripts/home-art/extract.mjs:21` (the manifest import), `:35-36` (`svgDir` and `outDir`)
- Create: `scripts/home-art/places.mjs`
- Create (generated): `src/features/explore/art/*` (one `.tsx` per piece, `types.ts`, `index.ts`)

**Interfaces:**

- Produces:
  - CLI: `node scripts/home-art/extract.mjs <svg-dir> [manifest] [out-dir]`. The defaults are `scripts/home-art/manifest.mjs` and `src/features/home/art`, so today's command is unchanged.
  - `@/features/explore/art` exports `pieces: Record<string, { Art: ArtComponent; box: ArtBox }>` and, per piece, `<Pascal>` plus `<camel>Box`. The pieces are `dia-a-grave`, `dia-a-breve`, `dia-a-circ`, `dia-o`, `place-mark`, `photo-mark` and `fact-mark` (for example `DiaO`, `diaOBox`, `PlaceMark`, `placeMarkBox`).

- [ ] **Step 0: Render the comp pages to compare against (Tasks 1, 2 and 5 use them)**

  `ĐỊA FULL.pdf` has no text layer, and no PDF tool is installed. Render the pages with PDFKit, writing the script outside the repo:

  ```swift
  import PDFKit; import AppKit
  let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
  for i in 0..<doc.pageCount { let p = doc.page(at: i)!; let b = p.bounds(for: .mediaBox)
    let img = p.thumbnail(of: NSSize(width: b.width/2, height: b.height/2), for: .mediaBox)
    try! NSBitmapImageRep(data: img.tiffRepresentation!)!.representation(using: .png, properties: [:])!
      .write(to: URL(fileURLWithPath: "\(CommandLine.arguments[2])/page-\(i+1).png")) }
  ```

  Run: `mkdir -p /tmp/dia && swift render.swift "$DIA/ĐỊA FULL.pdf" /tmp/dia`
  Expected: `page-1.png` … `page-6.png`, about 12 s. The pages map to screens as in the design's table.

- [ ] **Step 1: Make the manifest and output folder arguments**

  In `extract.mjs`:
  - Replace the static `import { pieces } from "./manifest.mjs"` with a top-level `await import(pathToFileURL(resolve(process.argv[3] ?? join(here, "manifest.mjs"))).href)`.
  - Read `outDir` from `process.argv[4]`, defaulting to `src/features/home/art`.
  - Update the usage comment at the top.

- [ ] **Step 2: Find each piece's child-index path**

  Open `$DIA/HỒ GƯƠM.svg` (395 KB, no photos) in Chrome. For each piece in the design's art table, note its path from the root `<svg>`, as `manifest.mjs` does.
  - Glyphs that live only in a 140 MB export (`VĂN MIẾU.svg` for Ă, `LONG BIÊN.svg` for Ầ, `HTTL.svg` for O): first make a stripped copy outside the repo, then open that:
    `perl -pe 's/(xlink:)?href="data:[^"]*"//g' "$DIA/HTTL.svg" > /tmp/httl.svg`
  - Compare each glyph with the PDF page it comes from (step 0). If one is broken, follow the fallback order in the design (another SVG → `glyph-hero-a` for À → `pdftocairo -svg`).

- [ ] **Step 3: Write `scripts/home-art/places.mjs`**

  It exports `pieces` in the same shape as `manifest.mjs` (`name`, `source`, `paths`, `note`), one entry per piece, with `source` set to the SVG file name.

- [ ] **Step 4: Run the extraction**

  Run: `node scripts/home-art/extract.mjs "$DIA" scripts/home-art/places.mjs src/features/explore/art`
  Expected: `Wrote 7 pieces to …/src/features/explore/art`, and `git status` shows no change under `src/features/home/art/`.

- [ ] **Step 5: Check types**

  Run: `pnpm typecheck`
  Expected: exit 0.

- [ ] **Step 6: Commit the design and this plan, then the art**

  1. `but diff`
  2. `but commit -b 40-places-dia -m "docs(plans): add the ĐỊA point page design and plan" <ids of docs/plans/2026-11-19-places-dia-*.md>`
  3. `but commit -b 40-places-dia -m "chore(scripts): extract the ĐỊA art with its own manifest" <ids of the files above>`

---

### Task 2: Real photos for the five ĐỊA points

**Files:**

- Create: `public/points/<slug>/cover.jpg` for the five place slugs
- Delete: `public/points/hoang-thanh-thang-long/cover.png`
- Modify: `data/points/place.yaml` (`images` of d01–d05)

**Interfaces:**

- Produces: each place has `images[0] = { src: "/points/<slug>/cover.jpg", width, height, alt: { vi, en } }`, with no `temporary`.

- [ ] **Step 1: Pull the five originals out of `$DIA/ĐỊA.svg` into a temp folder**

  Decode each `<image href="data:image/…;base64,…">` to a file. Keep the script in your temp folder, not in the repo. Expected:
  - three landscape images: 6000 × 4000 JPEG, 6249 × 4166 PNG, 3054 × 2048 PNG;
  - two portrait images: 4012 × 5690 PNG, 4151 × 6244 PNG.

- [ ] **Step 2: Match each photo to its point by eye** (against the comp renders of Task 1 step 0), then export each one:

  Run: `sips -Z 2400 -s format jpeg -s formatOptions 80 <original> --out public/points/<slug>/cover.jpg`
  Expected: each file is under 1 MB (`ls -l`). If one is over, lower `formatOptions` for that file.

- [ ] **Step 3: Update `images` in `data/points/place.yaml`**

  - For each point, set `width` and `height` to the exported size (`sips -g pixelWidth -g pixelHeight`) and add `alt.vi` and `alt.en` describing the photo. Drop `temporary`.
  - Delete the old `cover.png` placeholder.

- [ ] **Step 4: Verify that the build accepts the files and the explore slide shows them**

  - Run: `pnpm build`
    Expected: success, with no `missing file` error.
  - `preview_start next-dev`, open `/vi/explore` at 1920 × 1080.
    Expected: all five gates show their photo, as on comp page 1.

- [ ] **Step 5: Commit**

  `but commit -b 40-places-dia -m "feat(content): add the real photos of the ĐỊA points" <ids>`. Mention `Refs #44` in the body.

---

### Task 3: Content model, bold marks, ĐỊA glyphs and comp text

**Files:**

- Modify: `src/content/index.ts` (the `Point` interface, at lines 29–55; `validate()`, in the per-point loop at about line 285)
- Modify: `src/features/home/rich-text.tsx` (`Atom`, `atoms()`, `draw()`, the error text)
- Modify: `src/features/home/glyphs.ts`
- Modify: `data/points/place.yaml`
- Modify: `SPEC.md` (Part 2, Points)

**Interfaces:**

- Consumes: `pieces` from `@/features/explore/art` (Task 1).
- Produces:
  - Optional `Point` fields: `headline?: Localized`, `headlineIndent?: number` and `shortName?: Localized`.
  - `RichText` renders `{b:text}` as `<strong>`.
  - Glyph marks `{dia-a-grave:à}`, `{dia-a-breve:ă}`, `{dia-a-circ:ầ}` and `{dia-o:o}`.

- [ ] **Step 1: Add the three fields to `Point`**

  Document each in one comment line, as the design writes it.

- [ ] **Step 2: Validate `headlineIndent` in `validate()`'s per-point loop**

  `headlineIndent` is either absent, or `Number.isFinite(v) && v >= 0`. Otherwise push `` `${p.slug}: headlineIndent must be a number ≥ 0` ``.
  - `headline` and `shortName` need no new check: `walk()` already fails an empty `vi`.

- [ ] **Step 3: Add the `{b:…}` mark to `RichText`**

  - Text atoms get `bold?: boolean`.
  - In `atoms()`, `name === "b"` pushes `{ text: letters, bold: true }`.
  - `draw()` wraps a bold atom in `<strong>`, keeping its tone class if any.
  - Change the unknown-mark error to `` `unknown text mark "{${name}:…}"` `` (it no longer names `data/home.yaml`).

- [ ] **Step 4: Register the ĐỊA glyphs in `glyphs.ts`**

  - Look pieces up in `{ ...pieces, ...placePieces }`, where `placePieces` comes from `@/features/explore/art`.
  - Add one `on(baseline, cap, [name])` per new glyph, under a `// Places (ĐỊA comps)` comment. Each glyph uses the baseline and cap height of the line it sits on in its source SVG, measured in Task 1 step 2.

- [ ] **Step 5: Edit `data/points/place.yaml` to the comp**

  - `headline` (vi and en) and `headlineIndent`, from the design's headline table. Use the glyph marks, with `\n` between lines.
  - `shortName` (vi and en): Hoàng thành, Văn Miếu, Hồ Gươm, Phố cổ, Long Biên / Imperial Citadel, Temple of Literature, Hoan Kiem Lake, Old Quarter, Long Bien Bridge.
  - `{b:…}` around the runs the comp bolds in each `story`.
  - `since`, `kind`, `hours`, `price` and `hook`, from the design's comp-vs-YAML table. Separate the hours cells with `" / "`.

- [ ] **Step 6: Verify**

  - Run: `pnpm typecheck && pnpm build`
    Expected: success. A misspelled mark fails the prerender with `unknown text mark`; fix the YAML if it does.
  - Run: `grep -c "headline:" data/points/place.yaml`
    Expected: `5`.
  - Check that every `headline.en` and `shortName.en` is non-empty. An empty one would show Vietnamese on `/en` pages.

- [ ] **Step 7: Update `SPEC.md` Part 2, Points**

  - Replace the `PointBase`/`Place`/`Taste`/`Craft` block with the single `Point` interface as it now is in `src/content/index.ts`, including `since`, `mapLocation`, `Photo.temporary` and the three new fields.
  - Add one line on the text marks: `{glyph-…:x}` and `{b:…}`.

- [ ] **Step 8: Commit**

  `but commit -b 40-places-dia -m "feat(content): add headlines, short names and bold marks for the ĐỊA points" <ids>`

---

### Task 4: Move the point page onto the board frame

**Files:**

- Move: `src/app/[lang]/(site)/explore/[slug]/{page.tsx,page.module.css,point-motion.tsx}` → `src/app/[lang]/explore/[slug]/`
- Delete: `src/app/[lang]/(site)/explore/[slug]/sticky-name.tsx`
- Create: `src/app/[lang]/explore/[slug]/not-found.tsx`
- Keep: `src/app/[lang]/(site)/explore/explore-motion.ts`; the login slideshow imports it.

**Interfaces:**

- Produces: the route `/[lang]/explore/[slug]`. It renders `.home > .board` with `<HomeHeader lang current="explore" />`, `<main>`, `<Frame lang />`, then `<SiteFooter lang />`, as `src/app/[lang]/explore/page.tsx` does.

- [ ] **Step 1: Move the files**

  - `point-motion.tsx` imports `motionAllowed` from `@/app/[lang]/(site)/explore/explore-motion`.
  - Remove `StickyName` and the back link from `page.tsx`.

- [ ] **Step 2: Wrap the page in the board frame**

  - Wrap the existing content as in the Interfaces block above.
  - The board gets a page class with `height: auto; min-height: calc(2348 * var(--u))`. Its bottom edge is drawn as on `/explore`.
  - Keep `instant = false`, `generateStaticParams` and `generateMetadata` unchanged.

- [ ] **Step 3: Add `not-found.tsx`**

  `not-found.tsx` renders above `page.tsx` in the same segment (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`). Write it as `export { default } from "../../(site)/not-found";`, with the comment `// ponytail: bare 404 text outside the rail frame; frame it if it's ever seen in a demo.`

- [ ] **Step 4: Verify**

  - Run: `pnpm typecheck && pnpm build`
    Expected: success; the build lists 24 point pages (12 × 2 languages).
  - With `next-dev`: `/vi/explore/van-mieu-quoc-tu-giam` shows the home header and frame, with no navy rail.
  - `/vi/explore/khong-co` and `/en/explore/nope` show the localized 404 text (`notFound.title` in each language).
  - The login page's slideshow still animates.

- [ ] **Step 5: Commit**

  `but commit -b 40-places-dia -m "refactor(explore): move the point page onto the home board frame" <ids>`

---

### Task 5: The point detail layout from the ĐỊA comps

**Files:**

- Modify: `src/app/[lang]/explore/[slug]/page.tsx`, `page.module.css`, `point-motion.tsx` (selectors only, if needed)
- Create: `src/features/explore/nearby.ts`, `src/features/explore/nearby.test.ts`
- Modify: `src/features/interactions/comments.module.css` (restyle only)
- Modify: `SPEC.md` (Part 1, Screens: Point detail)

**Interfaces:**

- Consumes:
  - `headline`, `headlineIndent` and `shortName` (Task 3);
  - `RichText` from `@/features/home/rich-text`;
  - `PlaceMark`, `PhotoMark` and `FactMark` from `@/features/explore/art` (Task 1);
  - `PointCard` from `@/features/explore/point-card`;
  - `StatCounts`, `Comments`, `FavoriteButton` and the page's existing `Favorite`.
- Produces: `nearbyLabel(name: string, km: number, lang: "vi" | "en"): string` in `src/features/explore/nearby.ts`. The file has no `@/` imports, so `node --test` can load it.

- [ ] **Step 1: Write the failing test `src/features/explore/nearby.test.ts`**

  ```ts
  test("nearby distances keep one decimal in the page's locale", () => {
    assert.equal(nearbyLabel("Phố cổ", 1, "vi"), "Phố cổ (1,0 km)");
    assert.equal(nearbyLabel("Văn Miếu", 1.2, "vi"), "Văn Miếu (1,2 km)");
    assert.equal(nearbyLabel("Old Quarter", 0.4, "en"), "Old Quarter (0.4 km)");
  });
  ```

- [ ] **Step 2: Run it**

  Run: `pnpm test`
  Expected: FAIL; `nearby.ts` does not exist.

- [ ] **Step 3: Implement `nearbyLabel`**

  Use `km.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })`.

- [ ] **Step 4: Run it**

  Run: `pnpm test`
  Expected: PASS.

- [ ] **Step 5: Lay out the page in `page.tsx` and `page.module.css`**

  Follow the design's layout map and its items 1–8, in that order.
  - **Units and values:** every size is `calc(N * var(--u))`, with N measured in `HỒ GƯƠM.svg`. The content runs from x 280 to 1690; the photo box is 883 × 546; the right column starts at x 1196.
  - **Info row:**
    - `cells()` drops `price` for every layer.
    - Place cells: `since` · `kind` · one cell per `" / "` line of `hours`.
    - `<dt>` stays, with `className="sr-only"`.
  - **Headline:**
    - `<h1 data-reveal>` holds `<RichText text={(point.headline ?? point.name)[lang]} />`.
    - Split the headline text on `\n` and render each line as a `display: block` span with its own `<RichText text={line} />`.
    - Lines after the first get `padding-inline-start: calc(var(--indent) * var(--u))`, with `--indent: point.headlineIndent ?? 0` set on the `<h1>`.
  - **Hook:** split on `" / "`, uppercase, colored by `[data-layer="place"]` (lime-600), with “ ” from `::before` and `::after`.
  - **Price row:**
    - `price` (when set) · `address`, then a `Link` to `/${lang}/maps?to=${slug}` with `t.directions` and the arrow.
    - Then, in the right column, the existing `Suspense` and `ErrorBoundary` favorite hole, plus `<StatCounts lang slug favorites />`.
  - **Photo:** `<Image fill>` of `images[0]`, with `object-fit: cover`, inside an 883 × 546 box. `<PhotoMark>` sits bottom-left (place only). Keep the current skeleton when there is no image.
  - **Right column:**
    - The story's paragraphs, each through `RichText`.
    - The `<audio>` block when `point.audio` is set.
    - The fact, with `<FactMark>` and a bold `t.fact + ":"`.
    - Nearby: a bold `t.nearby + ":"`, then `Link`s to each point, labeled `nearbyLabel((near.shortName ?? near.name)[lang], n.km, lang)` and joined by `" · "`.
  - **Layer section:**
    - `<PlaceMark>` (place only), then `layers[point.layer]` in `<h2>`.
    - Then `getPoints(point.layer)` without the current point, each in `<PointCard>`, in a 2-column grid.
  - **Comments:** `<Comments lang slug path />` last, across the content width. Restyle `comments.module.css` to the comp's type scale. Its `<h2>` matches the layer heading.
  - **Motion:** keep `data-media` (photo), `data-reveal` (headline, hook, price row), `data-cell` (info cells), `data-wipe` (story, fact, comments) and `data-unroll` (nearby, gates). Adjust `point-motion.tsx` only if a selector no longer matches.

- [ ] **Step 6: Update `SPEC.md` Part 1, Screens, the Point detail row**

  The content is: info row · headline · hook · price and address with directions, favorite and counts · photo · story · audio · fact · nearby · the layer's other points · comments.

- [ ] **Step 7: Check against the comps**

  At 1920 × 1080, screenshot each of the five pages and compare with comp pages 2–6 (Task 1 step 0).
  Expected: the same blocks in the same places, and the same headline glyphs. Nothing overlaps.

- [ ] **Step 8: Check other languages and layers**

  - `/en/explore/hoang-thanh-thang-long` shows the English headline, with the drawn O if `headline.en` uses it, and English short names in Nearby.
  - `/vi/explore/bun-thang-ba-duc` and `/vi/explore/ngu-xa` show their cells, with price once, the "Image" skeleton, a navy hook, and VỊ/NGHỀ gates. The console has no errors.

- [ ] **Step 9: Check the tools**

  - Signed out: the heart links to `/vi/login?next=/vi/explore/<slug>`.
  - Signed in, with a dev test account (SPEC Auth):
    1. The heart toggles and the favorites count changes.
    2. A comment posts.
    3. That comment's delete button removes it.

- [ ] **Step 10: Check reduced motion**

  `resize_window` keeps the 1920 viewport. Turn on reduced motion (macOS setting, or `matchMedia` emulation), then reload.
  Expected: every block is visible at once, and no element keeps `clip-path: inset(0 0 100% 0)`.

- [ ] **Step 11: Commit**

  `but commit -b 40-places-dia -m "feat(explore): lay out the point page from the ĐỊA comps" <ids>`

---

### Task 6: Full check and PR

**Files:** none.

- [ ] **Step 1: Run the full check**

  Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  Expected: every command exits 0.

- [ ] **Step 2: Push and open the PR into `dev`**

  Use `but push`, then open a PR with title `feat(explore): ĐỊA point pages from the designer comps`. The body has:
  - `Closes #40` and `Refs #44`;
  - the five page screenshots next to their comp pages;
  - the comp-vs-YAML text table from the design, flagging d03's dropped "lake free, 24/7" and d03's "Thế kỉ 15" against d01 and d04's Roman numerals, for the designer to confirm;
  - the PR attribution line.
