---
name: project-xm
description: A cinematic gallery of five Vietnamese heritage sites on a near-black stage.
colors:
  ink: "#0b0b0c"
  paper: "#efede8"
  dim: "#8e8e93"
  line: "#2a2a2d"
  surface: "#19191b"
typography:
  display:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.6vw, 3.75rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 3.5rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  focus: "4px"
  thumb: "8px"
  frame: "16px"
  pill: "999px"
spacing:
  gutter: "3vw"
  gutter-mobile: "16px"
  section: "18vh"
  section-mobile: "80px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  nav-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  frame:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.frame}"
    width: "min(45vw, 760px)"
    height: "64vh"
---

# Design System: project-xm

## Overview

**Creative North Star: "The Cinematic Gallery"**

One place at a time, lit on a dark stage. The interface is a near-black room with off-white type and one rounded photo frame. The photographs are the only source of colour. Type is large and medium-weight, set tight, and runs beside the frame rather than over it. Everything else (nav, footer, borders) stays quiet and grey so the image leads.

Density is low. A screen holds one subject, one short line of large type, and at most one action. Interaction is a slow swap, never a jolt: choosing a name crossfades the frame. The five sites are presented as a list of names beside a single frame, never as a card grid.

There is one theme. `color-scheme` is fixed to `dark`, and there is no light mode or OS-driven switching.

**Key Characteristics:**
- Near-black ground, off-white type, dim grey for inactive or secondary text.
- No accent colour; photographs supply all chroma.
- One 16px-radius frame as the hero object; pills for nav and the primary action.
- Hanken Grotesk 500 at large sizes, tracked -0.02em, line-height 1.15.
- Flat, tonal surfaces; hairline `line` borders for structure.

## Colors

A five-step neutral ramp from ink to paper, with no hue of its own.

### Neutral
- **Stage Black** (ink): page background everywhere; text colour on the paper CTA.
- **Gallery Paper** (paper): all primary text, active list names, route lines and pins, the CTA fill, the focus ring and the selection fill.
- **Dim Grey** (dim): inactive list names, the brand link in the nav, secondary sub-lines on mobile.
- **Hairline** (line): 1px borders on the map frame and footer, and between list rows on mobile.
- **Raised Surface** (surface): the nav pill, and the frame background before a photo loads.

### Named Rules
**The Photos Bring the Colour Rule.** No accent hue exists. Do not add one for links, buttons or states; state is carried by the paper/dim contrast.

**The Inverted Selection Rule.** Text selection is paper on ink inverted (paper background, ink text). Keep it.

## Typography

**Display / Body Font:** Hanken Grotesk (fallback `system-ui, sans-serif`), weights 400 and 500 only, loaded through `next/font` with the `latin` and `vietnamese` subsets.

**Character:** A plain neo-grotesk used big and medium-weight. It reads as a gallery wall label scaled up for a projector.

### Hierarchy
- **Display** (500, `clamp(1.75rem, 3.6vw, 3.75rem)`, 1.15, -0.02em): a single standalone statement per section, max 24ch, `text-wrap: balance`.
- **Headline** (500, about `clamp(1.5rem, 3vw, 3.5rem)`, 1.15, -0.02em): the hero phrase (max 9ch), the site-name list (max 14ch) and section h2s (max 14ch). Each instance tunes its clamp within this range. Mobile drops to a fixed 1.375–1.75rem.
- **Body** (400, 1rem, 1.4): running text.
- **Label** (400, 0.8125rem): nav links, photo captions, list sub-lines.

### Named Rules
**The Two Weights Rule.** Use 400 and 500 only. Large type is always 500 with -0.02em tracking and 1.15 leading; small type is 400 with normal tracking.

**The Short Measure Rule.** Large type is capped in `ch` (9–24ch) and balanced. Never let display or headline text run full width.

## Layout

- **Hero:** a three-column grid `1fr min(45vw, 760px) 1fr` filling `100dvh` minus the header. The phrase sits right-aligned in column 1, the frame in column 2 at 64vh tall, the names in column 3.
- **Gutters:** 3vw on desktop, 16px on mobile. **Section rhythm:** 18vh vertical padding on desktop, 80px on mobile.
- **Two-column sections** reuse the frame width: `min(45vw, 760px) 1fr` with a 6vw gap, bottom-aligned.
- **Header:** sticky, centred, floating 16px from the top. It does not span the width.
- **Below 800px:** grids collapse to one column. The frame becomes full-width at 4:5. Each list row becomes a 48px thumbnail plus name and sub-line, separated by `line` hairlines. Hover affordances are replaced by visible thumbnails.

## Elevation & Depth

Flat and tonal. Depth comes from stepping lightness (ink, then surface, then a slightly lifted panel), never from drop shadows on surfaces. Two legibility devices are allowed over photography:
- **Text glow** (`text-shadow: 0 0 12px rgb(0 0 0 / 0.6)`): on large type that may sit near imagery.
- **Caption scrim** (`linear-gradient(to top, rgb(0 0 0 / 0.65), transparent)`): under captions on photos.

**The Shadows Serve Legibility Rule.** Glow and scrim exist only to keep text readable on photos. They are not used for elevation.

## Shapes

- **Frame** (16px): the photo frame and any framed figure such as the map teaser.
- **Pill** (999px): the nav bar and the primary CTA.
- **Thumbnail** (8px): small photo thumbnails nested in lists.
- **Focus** (4px): the focus-ring radius.

The direction named a single 16px frame. The build also uses 16px for the map teaser frame and 8px for list thumbnails. Keep 16px as the only radius for large containers.

## Components

### Buttons
- **Primary (pill CTA):** paper fill, ink text, 500 weight, 999px radius, `14px 24px` padding. A trailing 16px inline-SVG arrow (1.5 stroke, `currentColor`) with a 10px gap.
- **Hover:** fill lifts to pure white. **Focus:** the global ring (below).
- No secondary button exists yet.

### Navigation
- **Header pill:** surface fill, 999px radius, centred and sticky. Label-size text (0.75rem below 640px), gap 12px rising to 20px. Scrolls horizontally rather than wrapping.
- **States:** the brand link is dim, other links are paper. Hover underlines the link (1px thickness, 0.3em offset).
- **Footer:** a `line` top border, a wrapped row of links at 0.875rem, underline on hover.

### Focus
- 2px solid paper outline, 4px offset, 4px radius, applied globally on `:focus-visible`.

### Gallery Frame (signature)
One rounded frame (surface fill, 16px, `overflow: hidden`) holding stacked full-bleed photos, each with a bottom caption scrim. A list of site names sits beside it.
- **Default:** site 1 is shown and its name is paper; the other names are dim.
- **Hover / `:focus-within` a name:** that site's photo fades in (opacity, 0.5s ease) and its name turns paper (colour, 0.4s ease). This is pure CSS via `:has()`, with no JS.
- **Reduced motion:** both transitions are off and the swap is instant.
- **Below 800px:** no hover; rows show their own thumbnails and all names are paper.

### Motion (pending)
SPEC mandates GSAP + ScrollTrigger + Lenis via `useGSAP`, with `gsap.matchMedia` for reduced motion. None of it is built yet. Only the CSS transitions above have shipped. Scroll-driven motion is an open decision, not a recorded pattern.

## Do's and Don'ts

### Do:
- **Do** use only the five colour tokens through their custom properties (`var(--ink)` and so on, or Tailwind `bg-surface`, `text-dim`).
- **Do** set large type at 500, -0.02em, 1.15 leading, capped in `ch` and balanced.
- **Do** give large photo containers a 16px radius, and pills to nav and primary actions.
- **Do** use 1px `line` hairlines for structure, and underline-on-hover for text links.
- **Do** put a scrim under any text placed on a photograph.
- **Do** turn off every transition under `prefers-reduced-motion`.
- **Do** load fonts with the `vietnamese` subset.

### Don't:
- **Don't** introduce an accent colour; the photographs carry the colour.
- **Don't** lay the five sites out as a card grid; show one place at a time.
- **Don't** add a light theme or respond to `prefers-color-scheme`.
- **Don't** use drop shadows for elevation; step tone instead.
- **Don't** use font weights other than 400 and 500.
- **Don't** add animation libraries other than GSAP + ScrollTrigger + Lenis.
