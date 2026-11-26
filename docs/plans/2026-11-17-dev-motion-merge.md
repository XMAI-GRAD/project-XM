# Merge dev's design and section motion

Owner instruction: update local dev, merge it into feat/homepage-design, preserve
dev's design and motion, and combine it with this branch's opening and floating
brand interaction. Work stays local; no push is requested.

## Inputs

- Local changes saved first as `55255ab` (floating rail brand and frame correction).
- Local dev fast-forwarded from `edc7847` to origin/dev `c76afd2` (#62).
- Incoming work: homepage section entrances and hover motion; redesigned About,
  Explore and footer; additional extracted SVGs and semantic motion hooks.

## Conflict resolutions

- `scripts/home-art/extract.mjs`: support dev's `parts`/`data-part` hooks alongside
  our letter identities, detail flags and symbol/copy wrappers. Keep dev's
  `data-art` root attributes and all new manifest entries.
- `art/logo.tsx` and `art/opening-wordmark.tsx`: regenerate those two pieces from
  the original local SVGs with the combined extractor. Other generated artwork
  stays byte-for-byte equal to dev. The new About/Explore/footer source exports
  are not available locally, so full regeneration was not attempted.
- `home.module.css`: retain dev's variable artboard height and add the homepage
  hold allowance. Keep both dev's new typography rules and our motion layering.
- `sections.tsx`: retain dev's motion wrappers/content hooks and restore our hero
  anchor/focus target through HeroMotion. Keep the localized rail return control.
- Old `explore-tabs.tsx`: accept dev's deletion. The new Explore design replaces
  that interface; its incoming implementation currently shows the place layer
  only, with taste/craft designs explicitly deferred upstream.

## Motion integration

Keep dev's artwork, easing, duration, word/glyph entrances, line drawing, counters,
ink sweeps, sprite hover and magnet hover. The shared `homeEnter` helper changes
only the entrance thresholds: subtract the current opening/hold transforms and
add the complete hold distance to later sections. This makes refresh/resize
measurement independent of the current scroll compensation.

The hero starts at opening completion, with a one-pixel allowance for native
anchor entry. It must not finish behind the hidden opening or wait for an extra
wheel event after the opening link is clicked. Other sections keep dev's original
70/80/85 percent viewport thresholds after the added hold distance.

About and Explore retain their 4320/1080-unit boards and current-page navigation.
Their shared header has a page-specific ID and no homepage motion controller;
their brand links return to the homepage header. The homepage retains the opening
letter morph, horizontal logo docking, composition hold, weather crossing,
background-aware pale mark, focus restoration and reduced/no-JavaScript fallback.

Cross-page header links pass a one-time entry request to the opening controller.
It scrolls/focuses the header after initialization, when Next would otherwise see
the translated header at viewport top and skip scrolling. The request is consumed
inside the scheduled frame so development effect replay does not lose it. Ordinary
Back/Forward does not create a request and retains its saved scroll position.

## Validation

Lint, explicit Windows test enumeration (38 tests), TypeScript and production build
pass. The build generates 61 pages with 110 existing untranslated content fields.
Formatting of the combined files and Git whitespace checks pass.

Production Edge browser checks pass for the opening/reveal, horizontal rail travel,
held composition, source brand geometry, search/history, repeated locale navigation,
touch, reduced motion, no JavaScript and page-bottom return. New checks cover dev's
hero, thread drawing and sprite hover, four counters, roles, heritage ink/text,
layer reveals/magnet hover, footer, and About/Explore routing and dimensions.
The old route test was updated for dev's new headers and absolutely positioned
sections; the hover check targets an actual filled sprite rather than the empty
center of the artwork. A counter check scrolls the numbers themselves into view.

Back from About restores the deep homepage position exactly (4958px in the 1440px
viewport check). Resizing at the bottom preserves the floating mark/return target;
cross-page header return also passes under reduced motion. No captured browser
JavaScript errors. Personally inspected the merged hero, docking, section art,
footer, About and Explore screenshots.

See [visual sequence](../../research/design/evidence/dev-motion-merge/merge-contact-sheet.png),
[combined motion checks](../../research/design/evidence/dev-motion-merge/merge-results.json)
and [history/resize checks](../../research/design/evidence/dev-motion-merge/history-results.json).

SPEC SHA256 remains
`5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
No dependency, lockfile, backend or source SVG changes are part of the resolution.

## Limits

Browser checks use the established local production Edge setup. Physical devices,
other browser engines, screen-reader audio and hardware performance are not
verified. External authenticated data requests remain unavailable in the sandbox;
this merge does not change those flows. Narrow viewport checks cover geometry and
lifecycle, not a new mobile design.
