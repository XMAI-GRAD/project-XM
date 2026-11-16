# Opening fade and header entrance

Owner request: as the page scrolls down, the header should appear from the top
while the opening gradually disappears, making the transition visually smooth.
Preserve the team's extracted SVGs and the existing letter morph.

Owner correction after checkpoint `ee2f492`: do not show the header or page content
until the text has stopped moving into the brand logo. The sequence below replaces
the checkpoint's overlapping reveals.

## Implemented behavior

One reversible ScrollTrigger timeline owns the transition over the existing
opening height. Native scrolling still supplies progress; no additional scroll
library or pin spacer was introduced.

- The first 72% of the opening scroll is reserved for the lettering. The entire
  incoming board, including header, content and frame, has opacity zero. Other
  logo details are also hidden. The navy backdrop fades to paper during this phase.
- At 72%, the letter shapes, scale and viewport position reach their final logo
  geometry. A compensating translation cancels the remaining native scroll, so
  the lettering stays still while the page reveals. The accessible entry link
  follows the same trajectory and hold.
- Between 32% and 56%, a vertical clip switches the wordmark to the header ink.
  Both ink layers remain opaque: crossfading them produced a faint grey wordmark
  against the dissolving background during visual review.
- Only after the lettering has settled does the board fade in over the remaining
  28%. Header controls enter from above, while the other logo details appear beside
  the stationary lettering. An explicit `reveal` phase enables the arriving controls;
  pointer input remains blocked while the board is still hidden in the `morph` phase.
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
pointer input throughout the lettering movement. Keyboard focus entering the board
completes the reveal immediately, so a header/search control cannot receive focus
behind the dissolving screen. This listener belongs to the same media context and
is removed during cleanup. The existing entry and skip links keep router history
and target focus through `HomeSectionLink`.

Reduced motion and no-JavaScript retain the static opening followed by the normal
homepage. Media cleanup restores board, content, navigation and backdrop styles.
All state and SVG references remain scoped to the mounted homepage instance.

## Verification

Production Edge at `localhost:3101`, with 1920×1080, 2560×1440, 390×844 and 320×700
viewports. Current evidence is in [settled-wordmark-reveal](../../research/design/evidence/settled-wordmark-reveal/).
The earlier `opening-header-reveal` evidence describes the superseded checkpoint.

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
- Five sequence groups pass: page/header/details stay invisible before the lettering
  settles; letter outlines and screen coordinates remain fixed throughout reveal;
  reverse scrolling hides the page before moving letters back; keyboard focus
  reveals its controls; reduced motion restores the static layout. Geometry and
  visibility checks cover all four viewport sizes.
- The 24 browser groups captured no JavaScript page errors. Intermediate frames
  were inspected visually. Endpoint comparisons against separate reduced-motion
  pages have zero pixel difference at all four viewport sizes.
- Lint, TypeScript, all 38 existing tests and the production build pass. Build
  output remains 61 pages with 110 existing English field fallbacks. Formatting
  is checked for changed files; unrelated repository formatting debt is preserved.

Physical devices, Safari/Firefox, screen-reader audio and hardware frame-rate
profiling remain unverified. The desktop artboard's mobile readability and the
previously recorded backend API-key issue are outside this transition change.

SPEC.md remains byte-for-byte unchanged, SHA256
`5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
The previous transition is committed as `ee2f492`. The owner requested a local
commit for this sequencing correction after validation. No push was requested.
