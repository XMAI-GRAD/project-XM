# Illustrated routes from the university

The owner requested a route from the fixed Hanoi Architectural University origin
to every destination, colored by that destination's theme. They selected
illustrated paths following the roads in the current map, with only the selected
destination's route visible.

Follow-up review: selecting a destination opens its details first. Pressing
“Lộ trình đến đây” dismisses the card and opens route view. Labels stay centered
above their pins and are clipped by the map normally; remove all edge/card/legend
collision offsets. These instructions supersede the initial automatic route and
external directions-button behavior.

Author all 12 paths against the current SVG's 1094 × 680 coordinate space. Keep
them in a separate YAML manifest, bound to the artwork source hash, with validation
for coverage, bounds and exact origin/destination anchors. Load them through
`src/content/`. These are illustration coordinates, not geographic navigation or
the four walking routes saved against the old map. The card's route action stays
inside the illustration. Preserve the configured geographic origin in content.

Draw the active path above the base roads and below pins, using the same navy,
brick red and teal as the theme text. A short GSAP reveal travels from the origin
to the destination; reduced motion shows the complete path immediately. Hover
does not change the route. Selection, clearing, theme changes, search, URL state,
pan/zoom and motion-preference changes must leave at most one current route.

Validate the manifest, inspect every path against the source roads, and use the
owner-approved temporary headless Edge workflow to check all destinations,
theme colors, interruptions and desktop/mobile rendering. Run targeted lint,
format, typecheck, unit tests and build. Preserve SPEC's free-form map section.
Local changes only; no commit or push.

## Result

Implemented all 12 routes in `data/map-design-routes.yaml`. The first vertex is
the fixed origin; the last is the corresponding authored pin. Shared stretches
follow the same traced SVG road contour, with short connections to offset icons.
The manifest is independent of the extraction script and validated on content
load. Regenerating the art does not overwrite it; moving an anchor or changing
the artwork source requires reviewing the routes.

The route button dismisses the card before drawing the line and fits the entire
route with both endpoints visible. URL state uses `to=<slug>&view=route`; selecting
a pin/row again returns to details. Escape or Clear route clears selection. The
button focuses and reveals the map after the card closes. New selections cancel
pending transitions, and Escape during dismissal takes priority over route view.
Motion preference changes preserve the camera position and finish pending
transitions appropriately. Hover remains above selection. All labels now use a
fixed `translateX(-50%)`, with no collision avoidance or edge repositioning.

The revised flow passes all 48 destination checks across VI/EN, 1920/390 and both
motion preferences: details without a line, CTA dismissal, full route visibility,
theme colors, focus, clear/reopen and direct-link states. Additional 1280 checks
cover interrupted selection, Escape during dismissal, reduced motion during
dismissal, search/theme clearing and the reported border case. With the origin
20px from the border, its label remains centered at 20px and clips naturally.
Opening the legend does not shift it. No external tab opens and no page errors
occur. Scoped lint/format, TypeScript and production build pass. Evidence is
recorded in `design-qa.md`.
