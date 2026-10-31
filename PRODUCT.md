# Product

<!-- impeccable:product-schema 1 -->

Derived from `SPEC.md` (the source of truth). Where they differ, SPEC wins.

## Platform

web

## Users

- The graduation defense committee, viewing on a desktop or a projector. They judge the design and motion.
- Public visitors on desktop and mobile, browsing Vietnamese cultural heritage.

## Product Purpose

A graphic-design student's graduation project: an online gallery of 5 Vietnamese cultural heritage sites, joined by a north-to-south route on an illustrated map. It ships as a website and an installable PWA, in Vietnamese (default) and English. Motion and design are the focus; code is secondary.

## Positioning

A designed, authored journey through five places, not a heritage directory or travel app. disannoi.vn is the function reference (home, tour, map), not the look.

## Operating Context

- Presented live at the defense, so the first viewport and motion must read on a projector.
- Everything is readable without logging in. Google login only unlocks favorites and comments.

## Capabilities and Constraints

- Screens: landing/gallery, heritage detail, interactive map, article, profile, about, login.
- Content lives in `data/heritages.json`, images in `public/heritages/<slug>/`.
- Motion stack: GSAP + ScrollTrigger + Lenis only; every animation respects `prefers-reduced-motion`.
- One designed theme (cinematic near-black). No theme switching.
- Fonts must include full Vietnamese glyphs.
- Undecided: the final 5 sites and articles (O-04), map art style (O-05), Lottie/3D assets (O-02).

## Brand Commitments

- Feel references named by the team: das.info.vn, collectivedesign.agency/capabilities, wildyriftian.com, analogueagency.com/cases-overview.
- No name or logo yet (working name `project-xm`).

## Evidence on Hand

- No final content or photography yet. `public/heritages/` holds placeholder images only.
- Do not invent visitor numbers, awards or quotes.

## Product Principles

- The places lead; the interface recedes behind them.
- One journey, north to south: the route is the spine of the site.
- Bilingual by design: Vietnamese first, English equal.
- Built to be presented: legible at projector scale.
