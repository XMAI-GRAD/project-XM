# Extracted SVG homepage with opening scroll/morph

> **Later motion update:** the lettering now settles before the header and content
> appear. See [the current transition record](../../docs/plans/2026-11-17-opening-header-reveal.md)
> for timing, geometry, accessibility and the latest 24 browser check groups.
> The SVG extraction architecture below is unchanged.

Owner correction: use the team's SVG extraction and homepage from `origin/dev`
(`edc7847`), preserving our opening scroll/morph interaction. This supersedes the
initial merge choice documented in `docs/plans/2026-11-16-sync-dev-homepage.md`.
The owner requested a local checkpoint commit on `feat/homepage-design` after the
subsequent opening fade/header entrance update. No push was requested.

## Active implementation

The homepage route composes `Opening`, `HomeHeader`, `Hero`, `Thread`, `Stats`,
`Roles`, `Heritage`, `Layers`, `Frame`, and the shared footer from the remote.
Its YAML schema, content, typography, colors, sizing and artboard composition are
the remote implementation. Small additions provide the motion root, original
entry link, skip link, locale-specific anchor targets, and measurement hooks.

The canonical artwork pipeline is:

1. Original exports in `docs/lttem/svg/`.
2. Piece selection and letter mapping in `scripts/home-art/manifest.mjs`.
3. `node scripts/home-art/extract.mjs` generates the typed inline components in
   `src/features/home/art/`.

There are 36 artwork components plus the generated index and shared types. Only
the opening wordmark and header logo need new animation annotations. Their path
outlines, fills and viewBoxes match the remote exactly. Regeneration was run
twice and produced identical bytes across all 38 generated files.

The superseded `public/home/` SVG images, `scripts/extract-home-art.py`, old route
stylesheet and `home-controls` component were removed. The uncommitted duplicate
brand geometry/YAML loader and old motion component were replaced. No dependency
or lockfile changes were needed. Historical research/evidence is retained and
marked as such; it is not an alternate active implementation.

## Stable hooks for animation

The extractor adds `data-brand-letter` to the 17 corresponding paths in each
wordmark and `data-brand-detail` to the other header logo paths. It annotates
the original selected groups before pruning wrappers. Mapping belongs in the
manifest, not in hand-edited generated TSX.

Semantic keys follow HANOI, CREATIVE and CITY. The opening export's paint order
does not follow reading order: HANOI uses indices `13,7,14,16,15`; CREATIVE uses
`4,5,12,6,8,9,10,11`; CITY uses `0,3,1,2`. In the header logo, groups 3, 4 and 5
contain those words in reading order. Repeated E, I and T letters have distinct
keys. The star-shaped opening O morphs into the header O.

After replacing source artwork, inspect these mappings again. The extractor
rejects missing/non-path mappings and duplicate selections. The runtime also
requires 17 unique matching keys; an incomplete mapping leaves static artwork
visible. Future animations can address the separate extracted pieces or add
semantic hooks through the same manifest/extractor.

## Motion ownership and geometry

`src/features/home/opening-motion.tsx` reads the actual rendered source and target
SVG paths, computed fills and viewBoxes. It stores no duplicate source geometry.
The original generated SVGs remain untouched. A decorative overlay owns temporary
path definitions, two clipped sets of uses, and clones of the other logo details.

Each Bezier point is projected from its SVG viewBox into the measured homepage
coordinate system. GSAP MorphSVG interpolates those projected source/target paths;
ScrollTrigger samples a reversible timeline from opening top to opening bottom.
The section retains its layout height. During the opening, the incoming board is
counter-translated while the viewport-aligned navy backdrop fades out. The letter
morph finishes at 72% and holds still; only then does the board reveal, with its
header controls entering from above. The board reaches zero translation at the end;
normal page scrolling continues from there. There is no pin spacer or wheel
interception. An opaque color wipe keeps the wordmark readable during the dissolve;
header details appear only during the final 28% reveal.

At both endpoints, the overlay hides and the original inline SVG is displayed.
This preserves exact endpoint rendering. The original entry link's hit area
follows the wordmark; at completion it yields pointer/keyboard interaction to the
header logo link. The skip link goes directly to the hero's focusable anchor.

Both anchors use `HomeSectionLink`: Next Link preserves router history and its
`onNavigate` handler focuses the destination with `preventScroll`. A plain hash
anchor creates a null-state history entry in this Next version; Back from a later
route then changes the URL without restoring the homepage. A plain Next Link
fixes history but does not focus the target, so both behaviors are needed. Browser
Back/Forward/Back, keyboard focus and no-JavaScript anchors were verified.

`useGSAP` and `gsap.matchMedia` own media/lifecycle cleanup. Reduced motion and
no-JavaScript use the original static artwork and normal anchor navigation.
ResizeObserver watches stable layout elements, deduplicates measured sizes, and
schedules one rebuild per frame. The old timeline is reverted before rebuilding.
Per-instance `useId` values scope all SVG references, including retained Next.js
locale trees. Cleanup removes observers, listeners, temporary nodes, and styles.
Focus entering the incoming board completes the reveal immediately so controls
cannot be focused behind the fading backdrop. This focus listener is also cleaned
up with the media context. Measurements remove the board's animated translation
before calculating the final logo geometry.
`overflow-anchor: none` on the motion-enabled root prevents hash restoration from
following the transforming entry link.

## Validation

Production Edge at `localhost:3101`; screenshots use device scale factor 1.

- Eleven motion groups: four viewport sizes (1920×1080, 2560×1440, 390×844 and
  320×700), start/end/reverse, intermediate frames, resize round trip, rapid
  scroll, moving entry click, keyboard entry/skip, hash reload, live/initial
  reduced motion and no-JavaScript fallback.
- Four lifecycle/touch groups: repeated VI/EN switches, unique scoped SVG IDs,
  one active observer/morph, hidden-page cleanup, map navigation and return,
  preference changes, emulated touch swipe and moving-logo tap.
- Four integration groups: geometry matches `origin/dev`, active full-width SVG
  artboard, search/keyboard selection/Escape and Back/Forward/Back restoration,
  plus navigation to shared routes and return. No JavaScript page errors were
  captured in these three suites (19 groups total).
- Endpoint comparisons against static generated SVGs have zero pixel differences
  at all four viewport sizes. Intermediate frames were separately inspected;
  endpoint comparisons alone do not validate letter pairing through the morph.
- TypeScript, lint and all 38 existing tests pass. On Windows, tests were run with
  PowerShell-expanded filenames because the package script's quoted glob does
  not expand correctly: `node --experimental-strip-types --test` plus the files
  from `rg --files src -g '*.test.ts'` and `docs/map-labels/reference-geometry.test.mjs`.
- Production build passes: 61 pages, with 110 existing English field fallbacks.
  Changed-file formatting is checked separately from the repository-wide
  formatting debt already recorded in the prior reports.

Evidence is in [evidence/svg-homepage/](evidence/svg-homepage/). The current visual
and integration report is [design-qa.md](../../design-qa.md). Earlier 12-group
homepage regression reports tested the removed menu/mobile layout and must not
be represented as validation of this implementation.

The remote homepage scales a desktop artboard at narrow widths. Narrow-viewport
motion works, but this is not an approved mobile usability design. Physical
devices, Safari/Firefox, screen-reader audio and cross-hardware frame-rate
profiling remain unverified. This migration did not re-audit the remote artwork
against every PDF measurement or certify source contrast/editorial accuracy.
Existing server data requests returned `Invalid API key` during route checks;
navigation was verified, but the affected data-backed areas were not. No
credentials were inspected or changed as part of the homepage migration.

SPEC.md remains byte-for-byte unchanged, SHA256:
`5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.

Pre-migration files are backed up in `D:\XMAI GRAD\tmp\home-svg-migration-backup`;
the earlier Git stash `9dede3e1a56ea4fb2dada4d4b34caf4dbd1cb031` is also retained.
