# Scroll from the opening into the header logo

> **Updated architecture, 17 November:** the interaction has been ported to the
> team's extracted SVG homepage. The YAML geometry and old image pipeline below
> are historical and have been removed. Use [the migration record](../../research/design/2026-11-17-svg-homepage-migration.md)
> for current files, regeneration instructions and validation results.

Owner request: collapse the visible navy opening while its Hanoi Creative City
lettering shrinks, moves upward, and becomes the exact header wordmark. Preserve
the original design's dimensions, artwork, colors and functioning homepage.
Keep SPEC.md unchanged as previously instructed.

## Implementation

1. Pair all 17 original letter outlines from WEB-01 and WEB-02. Extract them with
   the existing source-hash-checked script into validated YAML content.
2. Measure the responsive opening and header image boxes. Project the original
   paths into a shared SVG in homepage document coordinates; use GSAP MorphSVG
   and ScrollTrigger through useGSAP to sample an absolute, reversible timeline.
3. Keep native document scrolling. The navy section leaves the viewport as the
   homepage enters. Clip two copies of the same animated paths at that boundary
   to preserve the opening colors on navy and the header ink on paper.
4. Keep the original semantic links and static images as the no-JavaScript and
   reduced-motion experience. Scope SVG IDs, observers and cleanup per homepage
   instance, including Next's retained locale trees. Re-measure on resize.
5. Inspect real browser frames from start to finish, compare both exact endpoints,
   test reverse/fast scrolling, resize, keyboard entry, locale/navigation lifecycle,
   reduced motion, and touch where supported. Run format, lint, types, tests, build.

## Validation

Completed all five steps. The inline morph hands back to the original SVGs at both
endpoints, and the opening link's hit area follows the lettering. No dependency or
lockfile change. See [implementation notes](../../research/design/2026-11-16-opening-scroll-morph.md)
and [visual QA](../../design-qa.md#opening-scroll-morph).

- Production Edge: eleven motion check groups across 1920×1080, 2560×1440,
  390×844 and 320×700. Start/end, reverse, rapid scroll, resize round trip, click,
  keyboard entry/skip, hash reload, reduced motion and no-JavaScript fallback pass.
- Four lifecycle/touch groups: repeated VI/EN switches retain one active observer
  and morph, no duplicate SVG IDs or cross-instance references; map navigation
  stops hidden path updates; live motion preference cleans/recreates correctly;
  emulated touch swipe and moving-logo tap work.
- All twelve existing homepage browser regression groups pass, with no captured
  JavaScript page errors across the three suites.
- Endpoint pixel comparisons against the original static images match exactly at
  all four viewport sizes. The six intermediate desktop captures and mobile touch
  capture were inspected directly.
- Lint, TypeScript, 38 existing tests and production build pass. The build generates
  61 pages and retains the existing 105 English editorial fallback notices. Tests
  use explicit PowerShell-expanded filenames because the package script's single
  quoted glob is incompatible with Windows.
- The existing development server at localhost:3000 also serves the updated markup
  and corrected letter data. Browser verification used production at localhost:3101.
- Changed-file formatting passes. Repository-wide `pnpm format:check` reports
  formatting issues in 157 existing, unchanged files, including SPEC.md. Those
  unrelated files were preserved; this is an existing repository check limitation.

Physical devices, Safari/Firefox, screen-reader audio and cross-device frame-rate
profiling are not verified. SPEC.md retains SHA256
`5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.
No commit or push requested.
