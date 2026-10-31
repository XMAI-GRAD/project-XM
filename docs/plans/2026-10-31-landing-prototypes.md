# Landing prototypes A / B / C

Goal: three styled landing mockups, one per reference family, so the team can pick a direction. No GSAP yet, no real content.

Routes: `/vi/proto/a`, `/vi/proto/b`, `/vi/proto/c` (and `/en/...`). A floating switcher (A/B/C + VI/EN) sits at the bottom of every prototype.

## Shared (done before the agents start)

- `src/app/[lang]/proto/_mock.ts`: 5 placeholder sites (`mockHeritages`, route order north → south) and UI copy (`mockCopy[lang]`). Both languages.
- `src/app/[lang]/proto/layout.tsx`: hides the root header and renders the switcher.
- One dev server on `http://localhost:3000`.

## Hero (all three): index of the 5 heritages

The first viewport is an index of the five sites. Hovering or focusing a row reveals that site's image. Each prototype expresses it in its own grammar:

| | World | Hero index |
|---|---|---|
| A | DAS × Wildy Riftian: saturated yellow and black, giant tight grotesk, hairline-framed panels with corner crosshairs, small mono metadata | Five huge name rows, numbered by route stop, spanning the width. Hover/focus inverts the row to black and shows a framed image panel |
| B | Collective: near-black, one large rounded image frame in the centre, words swapping left and right of it | The five names stack on the right of a fixed centre frame. The active name is bright and the others dim; hover/focus swaps the frame's image |
| C | Analogue: off-white, a quiet grid of rounded thumbnails with small captions | A five-column thumbnail grid. Hover/focus lifts a thumbnail and enlarges its caption |

## Sections after the hero (all three)

1. Intro statement (`mockCopy.intro`) at large size.
2. Map teaser: a simple schematic SVG of the route through the 5 pins (`map.x/y`), with a link to `/[lang]/map`.
3. Footer: nav, `mailto:` contact, placeholder note.

## Rules

- Each agent writes only inside its own `src/app/[lang]/proto/<a|b|c>/`.
- No new dependencies, no hotlinked images. Images are labeled placeholder blocks.
- Fonts via `next/font/google` with the `vietnamese` subset, loaded in the variant's own folder.
- Hover reveals also fire on `:focus-visible`; at 390px they work by tap or are always visible. Transitions are off under `prefers-reduced-motion`.
- Root layout already renders `<main>`; prototypes don't add another.
- Lint only your folder: `pnpm exec eslint "src/app/[lang]/proto/<x>"`. Don't run `next dev`, `next build` or `pnpm typecheck`.

## After

The orchestrator runs lint, typecheck and build once, screenshots all three at 1440 and 390, and fixes what it finds. Once a direction is picked: move copy into the dictionaries, read content through `@/content`, write DESIGN.md, then delete `proto/`.
