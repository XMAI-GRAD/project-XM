# Opening fade and header entrance

Owner request: as the page scrolls down, the header should appear from the top
while the opening gradually disappears, making the transition visually smooth.
Preserve the team's extracted SVGs and the existing letter morph.

## Implemented behavior

One reversible ScrollTrigger timeline owns the transition over the existing
opening height. Native scrolling still supplies progress; no additional scroll
library or pin spacer was introduced.

- The incoming homepage starts with its header just above the viewport. A
  counter-translation offsets native scrolling and lets the header ease down
  into its final position during the first 55% of the opening scroll.
- The opening backdrop remains in the viewport while its opacity falls from
  one to zero over the first 90%. The original wordmark stays separate and
  continues morphing toward the real header logo.
- Between 32% and 56%, a vertical clip switches the wordmark to the header ink.
  Both ink layers remain opaque: crossfading them produced a faint grey wordmark
  against the dissolving background during visual review.
- Homepage artwork fades in from 38% to 88%. Navigation labels fade in from
  72% to 90%, after the moving wordmark has passed most of their area. The other
  logo details retain their final 22% reveal and follow the incoming header.
- At 100%, the board has zero translation, all page content is opaque, the
  backdrop is transparent, and the original header SVG replaces the decorative
  morph. Further scrolling uses the normal document layout with no position jump.

SVG extraction, path geometry, final page spacing, copy, colors and sizes are
unchanged. Only animation hooks were added to the opening backdrop and frame.

## Geometry and interaction details

The board moves during the transition, so its current translation must be removed
when measuring the target logo. Measurements subtract the board's bounding-box
offset from its natural `offsetTop`; this preserves final geometry during resize
and reverse scroll. ResizeObserver still watches stable dimensions, and layout
contexts are reverted before rebuilding.

The navy backdrop does not intercept pointer input. The covered board ignores
pointer input at the opening's starting frame. Keyboard focus entering the board
completes the reveal immediately, so a header/search control cannot receive focus
behind the dissolving screen. This listener belongs to the same media context and
is removed during cleanup. The existing entry and skip links keep router history
and target focus through `HomeSectionLink`.

Reduced motion and no-JavaScript retain the static opening followed by the normal
homepage. Media cleanup restores board, content, navigation and backdrop styles.
All state and SVG references remain scoped to the mounted homepage instance.

## Verification

Production Edge at `localhost:3101`, with 1920×1080, 2560×1440, 390×844 and 320×700
viewports. Evidence is in [opening-header-reveal](../../research/design/evidence/opening-header-reveal/).

- Eleven existing motion groups pass: start/end/reverse, resize round trip,
  moving-logo click, rapid scroll, reduced motion, keyboard entry/skip, hash
  reload and no-JavaScript fallback.
- Four lifecycle/touch groups pass: repeated locales, unique local SVG IDs, one
  active morph/observer, map navigation cleanup, preference changes and emulated
  touch swipe/tap.
- Four integration groups pass: generated SVG geometry still matches `dev`,
  active SVG composition, search/Escape and Back/Forward/Back restoration, plus
  shared route navigation and return. The test now enters through the opening
  link after returning home; the header is intentionally above the viewport at
  progress zero.
- Four new transition groups pass: header moves from negative Y to zero;
  backdrop opacity falls monotonically while it stays in the viewport; normal
  scrolling resumes at the endpoint; keyboard/header focus reveals controls;
  reduced-motion cleanup restores static styles. The geometry checks cover all
  four viewport sizes.
- The 23 browser groups captured no JavaScript page errors. Intermediate frames
  were inspected visually. Endpoint comparisons against separate reduced-motion
  pages have mean channel error 0–0.0001 on a 0–255 scale, and no pixels with a
  difference greater than 16.
- Lint, TypeScript, all 38 existing tests and the production build pass. Build
  output remains 61 pages with 110 existing English field fallbacks. Formatting
  is checked for changed files; unrelated repository formatting debt is preserved.

Physical devices, Safari/Firefox, screen-reader audio and hardware frame-rate
profiling remain unverified. The desktop artboard's mobile readability and the
previously recorded backend API-key issue are outside this transition change.

SPEC.md remains byte-for-byte unchanged, SHA256
`5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
The owner requested a local checkpoint commit after validation. No push was requested.
