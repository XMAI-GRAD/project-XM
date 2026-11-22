# Map motion

Implement the owner's approved motion proposal on the existing map page:
entrance, theme and search transitions, linked row/pin hover and keyboard focus,
selected icon emphasis, interruptible bounded camera, card arrival/content swap/close,
and legend reveal. Reuse the source artwork and GSAP through useGSAP. Respect
reduced motion, including preference changes while the page is open.

Keep map bounds, canonical content, VI/EN, links, and focus restoration intact.
SPEC Part 3 leaves map interactions to the map owner; preserve SPEC unchanged.
Continue the existing local branch scope: no commit, push, or remote publication.

Validate in the approved headless Edge workflow with normal and reduced motion,
rapid repeated interactions, interrupted camera moves, desktop/mobile, and the
existing bounds/card regression scripts. Run formatting, lint, types, tests, build.

## Result

Implemented and validated. The motion matrix covers desktop/mobile, both motion
preferences, rapid input, camera interruption, selection changes, focus
restoration, and locale navigation during card exit. All 24 VI/EN card cases and
the mouse/keyboard/pinch/resize bounds checks pass. 6,121 animation frames showed
no blank map edges. Scoped formatting/lint, TypeScript, 44 tests and build pass.
See `design-qa.md` and `research/design/evidence/map-motion/`. SPEC unchanged;
no commit, push or remote publication.

Owner review replaced the circular selection treatment with a 35% larger theme
icon lifted 6px and a persistent name label with a theme-colored underline. The
label stays inside the map and clear of the location card while panning/zooming.
All 12 locations pass at desktop/mobile sizes across VI/EN and both motion
preferences (48 selection checks). Formatting, ESLint and TypeScript pass.
