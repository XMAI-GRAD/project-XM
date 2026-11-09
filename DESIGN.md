---
name: project-xm
description: Hanoi Creative City — a navy-and-seashell editorial frame with a side rail, big condensed type and small accent marks.
colors:
  navy-500: "#0d1855"
  navy-400: "#273991"
  navy-300: "#394fa0"
  navy-200: "#5c76ba"
  seashell: "#fff6f1"
  frosted-blue: "#9ceaff"
  dark-cyan: "#008b86"
  brick-red: "#b7262a"
  sunflower-gold: "#fec35a"
  lime: "#cbdb2b"
  mauve: "#dbb8ff"
typography:
  display:
    fontFamily: "Phudu, system-ui, sans-serif"
    fontSize: "clamp(3rem, 10vw, 10rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    textTransform: uppercase
  headline:
    fontFamily: "Phudu, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5.4vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.02em"
    textTransform: uppercase
  subheading:
    fontFamily: "Phudu, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  meta:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.08em"
    textTransform: uppercase
rounded:
  pill: "999px"
spacing:
  rail: "64px"
  pad: "clamp(16px, 2.4vw, 32px)"
components:
  button-primary:
    backgroundColor: "{colors.brick-red}"
    textColor: "{colors.seashell}"
    typography: "{typography.subheading}"
    rounded: "{rounded.pill}"
    padding: "16px 24px"
  nav-link:
    textColor: "{colors.navy-500}"
    hoverBackground: "{colors.navy-500}"
    hoverText: "{colors.seashell}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  rail:
    backgroundColor: "{colors.navy-500}"
    textColor: "{colors.seashell}"
    width: "{spacing.rail}"
---

# Design System: project-xm

Colors, ratio and fonts are set in [SPEC.md](SPEC.md) Part 3. This file describes how they are used. When the two disagree, SPEC wins.

## Overview

**North Star: "The Coordinated City"**

The site is an editorial frame. A navy rail runs down the left edge, a thin top bar carries the nav, and the page below is a stack of full-width bands. Type is big, condensed and uppercase. Accent colors mark pins, hover states and swatches, and frosted blue or dark cyan can fill a whole band, but never a whole page.

The frame comes from the former prototype A, which is now the main wireframe. All new UI builds on it.

There is one theme on a seashell background. `color-scheme` is fixed to `light`, with no dark mode.

**Key characteristics:**

- Seashell ground, navy type, navy bands.
- A 64px navy side rail holding the vertical logo and the explore CTA.
- Hairline navy borders between rows and around frames.
- Corner-cross marks on framed figures.
- Pills for nav links and the primary action.

## Colors

The tokens are CSS custom properties in `globals.css` (`var(--navy-500)`) and Tailwind colors (`bg-navy-500`, `text-seashell`).

**Ratio: 20% navy ramp · 40% seashell · 40% accents.**

- **Navy ramp (20%).** `navy-500` is the primary color and the default text color. It covers the rail, the footer and dark bands. `navy-400` is for a second dark band. `navy-300` and `navy-200` are for quieter lines and inactive states.
- **Seashell (40%).** The page background and the background of cards and panels.
- **Accents (40% together).**
  - Frosted blue and dark cyan carry the most (about 10% each). They can fill whole bands.
  - Brick red, sunflower gold, lime and mauve carry about 5% each.
  - Brick red is the primary button.

**Text on color.** Use seashell text on navy and on brick red. Use navy text on seashell and on every other accent. Dark cyan with any text, and seashell on `navy-200`, reach only about 4:1: large or bold text only.

**Layers.** Set `data-layer="place|taste|craft"` on an element and read `--layer-bg` and `--layer-pin`.

| Layer | `--layer-bg`   | `--layer-pin`  |
| ----- | -------------- | -------------- |
| PLACE | sunflower gold | navy-500       |
| TASTE | brick red      | sunflower gold |
| CRAFT | dark cyan      | brick red      |

## Typography

- **Phudu** (`--font-display`) is for headings, display type and subheadings.
- **Inter** (`--font-body`, Tailwind `font-sans`) is for body text, labels and meta.
- Both load through `next/font/google` with the `vietnamese` subset.

| Role       | Font  | Weight | Notes                                                                 |
| ---------- | ----- | ------ | --------------------------------------------------------------------- |
| Display    | Phudu | 900    | Uppercase, `clamp(3rem, 10vw, 10rem)`, 0.95 leading, -0.03em          |
| Headline   | Phudu | 800    | Uppercase list names, section statements, -0.02em                     |
| Subheading | Phudu | 600    | Taglines, 1.2 leading                                                 |
| Body       | Inter | 400    | 1rem, 1.4 leading                                                     |
| Meta       | Inter | 400    | The global `.meta` class: 0.72rem, uppercase, 0.08em, tabular numbers |

Phudu has no width axis, so don't use `font-stretch`.

## Layout

- **Shell** (`layout.module.css`): a grid of `64px` rail plus content. The rail is sticky at full height.
- **Top bar:** brand and designation as meta on the left, and pill nav links, the account link and the VI/EN switch on the right. A 1px navy bottom border.
- **Bands:** full width, with `--pad` gutters (`clamp(16px, 2.4vw, 32px)`). Dark bands use generous vertical padding (`clamp(64px, 12vw, 160px)`).
- **Lists:** rows split by 1px navy hairlines, each row a code, a big name and a meta line.
- **Footer:** a navy band with a 4px mauve top border, holding the nav, the contact block and the credits.
- **Desktop first.** Below 48rem the rail becomes a top strip. A dedicated mobile design comes after 2026-11-23.

## Components

- **Primary button:** a brick-red pill with seashell text and a trailing arrow. Hover turns it navy.
- **Nav link:** an uppercase Phudu pill. Hover inverts it to navy with seashell text. The language switch is always inverted.
- **Framed figure:** a 1px navy border, a corner cross at each corner, and a layer-colored fill behind the photo or placeholder label.
- **Hover panel (home list):** on hover-capable desktops, a framed figure appears at the right of the row. Without hover, it shows inline.
- **Opening row (explore):** a list row without a code or hover panel. A plus turns into a minus when it opens to a short description and the primary button. A hovered row inverts to navy. An open row's header and its button are sunflower gold with navy text, the button with a navy hairline: an explore-only change from the brick-red primary. The page uses navy, seashell and frosted blue, with gold only on the open row. The meta line sits under the name; it and the description grow with the viewport (up to 1.25rem and 1.5rem), so both read on a projector.
- **Folder tabs (explore):** under a frosted blue title band. The active tab is navy; inactive tabs are seashell.
- **Point detail:** a full-width photo hero with a navy scrim, the name and the gold directions pill at the bottom, and seashell pills for back and favorite at the top. Below it a hairline info bar whose first cell leads in display type, then the story, under a name line that appears once the hero has scrolled away and stays pinned, with the comment thread in a sticky side column. Frosted blue marks only the little-known fact.
- **Account:** a slim identity strip (avatar circle, the display name as a headline-size h1 edited in place, an outline pill to edit, sign out at the right), then the saved points as a wall of framed figures: the home hover panel kept open, with code and layer caps, a 16/10 layer-filled figure, the name, and the address beside an outline remove pill. Cards invert to navy on hover and focus. A removed card stays until reload with its figure faded and a brick-red "save again" pill. With nothing saved, a frosted blue frame teaches the heart and links to explore.
- **Focus:** a 3px navy outline with a 3px offset. Inside navy areas it is seashell. Explore tabs and rows sit inside a frame that clips, so their outline is inset by 6px, and a focused row fills navy with a frosted blue outline.

## Motion

Use GSAP + ScrollTrigger + Lenis through `useGSAP`, with `gsap.matchMedia` for reduced motion. GSAP drives explore and the point page. On a point page the photo settles and the name slides in, the info bar unrolls after it, and the content below reveals once on scroll with ScrollTrigger. Rows slide out from under their top hairline with a matching `clip-path`, staggered, on arrival and on a tab change; the old rows leave faster, and the panel height moves in the same timeline. Opening a row tweens its height, collapses the open row and keeps the clicked header in place. Everything else is short CSS color and opacity transitions, wrapped in `prefers-reduced-motion: no-preference`.

## Do's and Don'ts

### Do

- **Do** keep the 20 / 40 / 40 ratio when no design is given.
- **Do** use the color tokens, never raw hex, in components.
- **Do** use hairline navy borders for structure.
- **Do** use frosted blue or dark cyan for bands that would otherwise be navy.
- **Do** turn off every transition under `prefers-reduced-motion`.

### Don't

- **Don't** fill a whole page with an accent color.
- **Don't** add a dark theme or respond to `prefers-color-scheme`.
- **Don't** use drop shadows for elevation.
- **Don't** add animation libraries other than GSAP + ScrollTrigger + Lenis.
- **Don't** hardcode content text. It comes from `data/*.yaml` or the dictionaries.
