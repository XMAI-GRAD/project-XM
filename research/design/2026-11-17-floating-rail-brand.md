# Header brand to floating rail mark

Owner request, 17 November 2026: first commit the prior collapse implementation,
then make the header brand collapse, move left, become the pale mark in the supplied
rail screenshot and remain available as a return-to-header control. The checkpoint
is `2111b7e`. This implementation supersedes the sticky-header behavior in the
[previous collapse study](2026-11-17-header-brand-collapse.md).

## Source and implementation

The supplied screenshot identifies the existing `RailMark` artwork from
`docs/lttem/svg/WEB-02-HomePage.svg` node `/79`, extracted by the canonical generator.
Its box is x=47.32, y=361.22, width=85.3, height=85.31 in the 1920-unit artboard.
It uses the source pale fill `#fff8f5` and outline `#cce0f4`. These are read from
the SVG at runtime; no new approximation or duplicate path dataset is stored.

The original header home link remains the interactive element. A temporary clone
of its SVG supplies three morphing roof paths while the lettering fades. Original
paths are never mutated: the earlier opening-to-wordmark morph still needs them.
At completion complementary clips combine the colored flight artwork with an exact
pale rail SVG clone, following the actual rail background. The decorative rail copy is hidden during the enhancement, so there is
one visible mark. The static rail anchor remains useful when JavaScript is absent.

The header, main content and original frame stay together until the logo reaches
its destination, then scroll away with the document. After the opening, native scroll
progress controls a range of `max(280px, 2 * header height)`. The first 22% collapses
the lettering and centers the symbol; the remaining 78% moves left and morphs
into the rail mark. The outline appears late; the source colors remain visible
over paper. After release, the pale version appears only where the original lime
rail passes behind the symbol. Returning through this range reverses the sequence.

The link's vertical translation compensates document scroll after the opening.
The header cancels scroll only up to the docking distance; the link subtracts that
header compensation to avoid moving twice. Holding only the header cropped the
hero and detached the rounded frame corners, as the owner reported. The main
content and frame now share that compensation. A CSS hold allowance extends the
scroll container without changing the 5400-unit artwork. No synthetic lime panel
or header background is added. The colored and pale logo clips follow the source
rail edge instead.
The weather/date briefly fades while the moving logo crosses its measured slot,
then returns once clear, preventing text and symbol from painting over each other.
Its screen height stays at the original header logo height throughout horizontal
travel and docking (y=45.73 at 1920px width); only x moves toward the rail. This
follows the owner's correction to remove diagonal travel. Its visible dimensions match the rail SVG;
an invisible minimum 44px hit area helps touch users at narrow widths. The original
header SVG keeps its own dimensions while the link's hit box narrows.

## Return behavior and lifecycle

Click or Enter scrolls to the natural bottom of the opening, not document y=0.
GSAP ScrollToPlugin uses 0.85s with `power2.inOut`; wheel, touch, key and resize
input cancel the return. Arrival focuses the header with `preventScroll`.
The scroll target rounds up when the opening height is fractional; a 1px resting
tolerance keeps the full header logo visible at that rounded position.

This local return does not add browser history entries. The anchor still has a
real locale-scoped `#home-entry` destination for no-JavaScript/modified clicks.
Reduced motion switches directly between full and rail states and returns instantly.
Locale/route cleanup removes cloned SVGs, listeners and active animation instances.

Opening target measurement uses the original CSS slot rather than the moving
link rectangle, so resizing a docked page cannot shift its later opening morph.
`HomeHeaderMotion` owns this logic, `HomeOpeningMotion` owns the original opening,
and the generator remains the owner of all source geometry.

## Evidence and validation

- [Frame correction before/after](evidence/floating-rail-brand/frame-fix-comparison.png)
- [Corrected frame at the reported viewport](evidence/floating-rail-brand/frame-user-viewport.png)
- [Original rail passing behind the mark](evidence/floating-rail-brand/frame-release.png)
- [Frame position checks](evidence/floating-rail-brand/frame-results.json)
- [Collapse, travel and docking](evidence/floating-rail-brand/rail-travel-sequence.png)
- [Source and floating mark comparison](evidence/floating-rail-brand/rail-comparison.png)
- [Full page with floating mark](evidence/floating-rail-brand/rail-page.png)
- [Main rail checks and geometry](evidence/floating-rail-brand/rail-results.json)
- [Touch, page bottom and route cleanup](evidence/floating-rail-brand/additional-results.json)
- [Fractional-height return](evidence/floating-rail-brand/fractional-results.json)
- [Rail pixel comparison](evidence/floating-rail-brand/rail-pixel-comparison.json)
- [Preserved opening sequence](evidence/floating-rail-brand/sequence-results.json)
- [Opening endpoint pixels](evidence/floating-rail-brand/morph-pixel-comparison.json)

The screenshot's crop/zoom is not a full artboard specification. The artwork comparison
uses the canonical SVG rendered at a 1920x1080 CSS viewport, DPR 1: two 180x240
rail crops at x=0/y=280. The combined image enlarges both equally. The source
shows its static rail; the implementation crop normalizes the mark to the same
position. This earlier crop compares artwork only; the current travel sequence and
full-page capture show the corrected horizontal placement. Geometry/fills/strokes match; small raster edge differences remain
(mean channel error 0.60/255). Original opening/header endpoints are pixel-identical.

Before the frame correction, 34 browser groups/cases, lint, TypeScript, 38 tests and
production build passed. For the latest correction, 26 browser groups were run:
frame (4), rail (6), opening sequence (5), lifecycle/touch (4), integration (4),
and page-bottom/touch/navigation (3). These passed with the production build,
TypeScript and targeted lint. The earlier artwork pixel comparisons are historical;
the new frame comparison shows the current composition. Source art, dependencies
and SPEC remain unchanged. See the
[plan](../../docs/plans/2026-11-17-floating-rail-brand.md) for test scope and limits.
