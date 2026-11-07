# Product

<!-- impeccable:product-schema 1 -->

Derived from `SPEC.md` (the source of truth). Where they differ, SPEC wins.

## Platform

web

## Users

- The graduation defense committee, viewing on a desktop or a projector. They judge the design and motion.
- Public visitors on desktop (mobile gets its own design after 2026-11-23), exploring Hanoi's heritage, food and crafts.

## Product Purpose

A graphic-design student's graduation project: the website of Hanoi Creative City — UNESCO City of Design. Its core is "Mạch nối ngàn năm": 12 points in three layers (PLACE 5, TASTE 4, CRAFT 3). It ships as a website and an installable PWA, in Vietnamese (default) and English. Motion and design are the focus; code is secondary.

## Positioning

A designed, authored city program, not a directory or travel app. hanoicreativecity.com (events) and disannoi.vn (map) are function references, not the look.

## Operating Context

- Presented live at the defense, so the first viewport and motion must read on a projector.
- Everything is readable without logging in. Google login only unlocks favorites and comments.

## Capabilities and Constraints

- Screens: home, about, explore, point detail, maps, events (placeholder), join (mock form), profile, login. See SPEC Part 1.
- Content lives in YAML files in `data/`, images in `public/points/<slug>/`.
- Motion stack: GSAP + ScrollTrigger + Lenis only; every animation respects `prefers-reduced-motion`.
- One designed theme: navy and seashell on the prototype A frame (SPEC Part 3, DESIGN.md). No theme switching.
- Fonts must include full Vietnamese glyphs.

## Brand Commitments

- Feel references named by the team: das.info.vn, collectivedesign.agency/capabilities, wildyriftian.com, analogueagency.com/cases-overview.
- Brand: Hanoi Creative City — UNESCO City of Design. No logo file yet.

## Evidence on Hand

- Final copy is in the content document (bản 07/11/2026). No photography yet: `public/points/` holds placeholder images only.
- Do not invent visitor numbers, awards or quotes.

## Product Principles

- The places lead; the interface recedes behind them.
- One journey, north to south: the route is the spine of the site.
- Bilingual by design: Vietnamese first, English equal.
- Built to be presented: legible at projector scale.
