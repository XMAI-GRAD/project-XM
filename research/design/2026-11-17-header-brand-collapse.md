# Hanoi Creative City header brand collapse

Implemented 17 November 2026, following the owner's
[Anthropic recording study](2026-11-17-anthropic-logo-scroll-reference.md).
The recording informed the visual sequence; timing and thresholds below are our
implementation choices. The original opening-to-header morph remains separate.

## Behavior and tuning

After the opening finishes, the homepage header stays at the top. Scrolling
farther fades/retracts the wordmark and UNESCO designation while the existing
three-color roof symbol moves into the center of the original home-link box.
The symbol retains its height, width and colors. Returning near the start of the
homepage reverses the same timeline: the symbol returns first, then the lettering
reappears. Scrolling upward far down the page does not expand the logo.

`src/features/home/header-motion.tsx` owns this behavior:

| Setting                        | Value                                               |
| ------------------------------ | --------------------------------------------------- |
| Copy fade/retraction           | 0.18s, `power1.inOut`, x = -8% of SVG viewBox width |
| Symbol movement                | Starts at 0.08s, lasts 0.45s, `power2.inOut`        |
| Total transition               | 0.53s; reversible during playback                   |
| Collapse threshold             | Opening end + `max(48px, header height * 0.4)`      |
| Expand threshold               | Opening end + 40% of the collapse distance          |
| Return into opening            | Immediately restore full brand for morph handoff    |
| Reduced motion / no JavaScript | Full expanded logo                                  |

The gap between thresholds prevents flicker around one scroll position. This is
a short timed animation triggered by scroll position, not a continuously scrubbed
collapse. The earlier opening morph remains directly controlled by scrolling.

## Artwork and lifecycle

The canonical SVG extractor now emits `data-brand-part="symbol|copy"` wrappers
from manifest paths. Movement belongs to those wrappers, leaving source path
geometry intact for the opening's morph reader. No hand-edited generated paths,
new compact artwork or dependency was introduced. Future re-exports should keep
the manifest mapping and verify the three symbol/four copy groups.

Symbol centering is measured in SVG user units. Header/logo outer dimensions and
the accessible home link remain unchanged. The sticky header reuses the extracted
frame corners, and the hero has a header-height scroll margin for skip navigation.
Opening target measurement uses the logo's offset within its header so sticky
positioning cannot corrupt the destination on resize.

`useGSAP` and a media context own the timeline and ScrollTrigger. Locale changes
and route removal clean them up. Restored scroll positions initialize the right
state. Reduced motion restores the full SVG; GSAP may leave identity transform
matrices, which are visually equivalent to no transform and must not be mistaken
for an active animation in tests.

## Evidence and validation

- [Collapse and expansion frames](evidence/header-brand-collapse/brand-sequence.png)
- [Full compact header/page](evidence/header-brand-collapse/compact-page.png)
- [Seven new browser groups and geometry](evidence/header-brand-collapse/results.json)
- [Intermediate style samples](evidence/header-brand-collapse/visual-samples.json)
- [Preserved opening sequence](evidence/header-brand-collapse/morph-contact-sheet.png)
- [Opening sequence assertions](evidence/header-brand-collapse/sequence-results.json)
- [Opening motion checks](evidence/header-brand-collapse/morph-results.json)
- [Lifecycle/touch checks](evidence/header-brand-collapse/morph-lifecycle-results.json)
- [Navigation/integration checks](evidence/header-brand-collapse/integration-results.json)
- [Endpoint comparison](evidence/header-brand-collapse/comparison-morph-endpoints.png)
  and [pixel measurements](evidence/header-brand-collapse/morph-pixel-comparison.json)

All 31 browser check groups passed in local production Edge. Lint, TypeScript,
38 tests and production build passed; changed-file formatting was checked.
The source SVG paths/fills/viewBox and SPEC are unchanged. The generator repeated
all 38 files identically. See the [plan](../../docs/plans/2026-11-17-header-brand-collapse.md)
for exact scope and remaining environment/device limitations.
