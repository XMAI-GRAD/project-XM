# Opening-to-header SVG morph

> **Historical implementation:** on 17 November this interaction was ported to
> the team's inline SVG components. The separate YAML path dataset and Python
> extractor described below no longer exist. The letter pairing, coordinate-space
> reasoning and lifecycle lessons still apply. Follow [the current implementation](2026-11-17-svg-homepage-migration.md)
> for future changes; the evidence below predates that migration.

Implemented on 2026-11-16 from the owner's request. The navy opening recedes with
native scrolling while its lettering shrinks and moves upward into the exact
header wordmark. Scrolling back reverses the same transformation.

## What the source artwork required

Both wordmarks contain 17 outlined letters, but their paths and alignment differ.
WEB-01 centers three rows; WEB-02 aligns those rows to the left beside the roof
symbol. In particular, the opening's star becomes the header's O, including its
counter. Scaling an image alone would not reproduce the target.

The extraction script now generates `data/home-brand.yaml` from the original
hash-verified SVG groups. It contains the paired outlines, original opening
paints, both source viewBoxes and the header's remaining roof/UNESCO paths.
`src/content` validates this data before passing it to the client component.
The raw source exports and hashes remain documented in the asset manifest.

The source path order is **not** reading order. The source indices for HANOI are
13, 7, 14, 16, 15; CREATIVE uses 4, 5, 12, 6, 8, 9, 10, 11; CITY uses 0, 3, 1, 2.
These correspond to header groups 3, 4 and 5 in reading order. An early pairing
swapped A/N: both endpoints still looked correct, but the letters crossed in the
middle. Checking intermediate frames is essential for this kind of feature.

## Coordinate system and animation ownership

`HomeOpeningMotion` owns a decorative inline SVG in homepage document coordinates.
The HTML opening and header still determine layout. At setup, measure the opening
logo's stationary wrapper, the header image and the root. For every original
Bezier anchor/control point, use:

```text
x = image.left - root.left + (sourceX - viewBox.x) * image.width / viewBox.width
y = image.top  - root.top  + (sourceY - viewBox.y) * image.height / viewBox.height
```

Project both sets of paths into the same coordinate system. ScrollTrigger samples
one timeline from the opening's top meeting the viewport top to its bottom meeting
the viewport top. Progress is effectively `clamp(scrollWithinOpening / height, 0, 1)`.
MorphSVG interpolates corresponding outlines, while a CSS transform moves the
original entry link's hit area with the lettering. No React state or layout reads
run on each animation frame. Geometry is remeasured on layout changes.

The section retains its stable layout height. Its visible navy area decreases as
the document scrolls, exposing the next section. This avoids a feedback loop from
animating the height that defines the scroll range. There is no pin spacer,
artificial scroll delay, wheel interception or additional scrolling library.

GSAP's documented APIs provide the path interpolation and scrubbed timeline:
[MorphSVG](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/) and
[ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/). The installed GSAP
already includes the plugin; package.json and the lockfile did not change.

## Paint, handoff and interaction

Two sets of SVG `use` elements reference the same 17 animated path definitions.
One is clipped to the navy opening and retains its original multicolor fills.
The other is clipped to the paper header and uses navy ink. This keeps the
lettering legible while it crosses the background boundary without a poorly timed
global color tween. The other header details appear over the last 22% of progress.

At progress 0 and 1, display the original SVG images and hide the decorative
overlay. This preserves the original rasterization at both endpoints. Normalized
inline paths can show slightly different antialiasing from an SVG image despite
matching geometry; the final handoff eliminates a permanent visual discrepancy.

The original opening link remains the accessible control, with its hit box moving
alongside the graphic. At completion it leaves the tab order and pointer hit testing;
the real header link owns interaction. Clicking/tapping or pressing Enter still
uses the normal header anchor. The skip link still goes straight to main content.

## Lifecycle and fallback

`useGSAP` owns the media context; each measured layout owns its own GSAP context.
ResizeObserver schedules at most one rebuild per frame, compares a size signature,
and observes only stable layout elements. Rebuilding reverts the previous timeline
before creating a new one and immediately samples the current scroll position.

Scope all element queries to the homepage instance and derive every SVG ID with
React `useId`. Next can retain a hidden page when navigating between locales.
Cleanup disconnects the observer, cancels pending work, removes the pageshow
listener, reverts the layout context and restores the normal link/DOM state.
Browser checks confirmed hidden instances do not continue changing paths.

After merging the document-only root layout from dev, browser scroll anchoring
could follow the entry link during hydration and move a restored header hash back
into the opening. The motion-enabled root uses `overflow-anchor: none` to avoid
that interference. It does not override native scrolling or fragment navigation;
repeated header-anchor reloads are included in the regression check.

`gsap.matchMedia` activates only for no-preference motion. A live switch to reduced
motion restores the static original design and native anchors. With JavaScript
disabled the same static composition works. Relevant primary documentation:
[React cleanup](https://gsap.com/resources/React/) and
[matchMedia](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>).

This applies the existing graphics research: retain semantic DOM, measure actual
layout, choose SVG for vector art, use a single progress clock, and explicitly own
resize/cleanup/fallback. The broader local research is in
`D:\XMAI GRAD\research\advanced-frontend-graphics` (HANDBOOK sections 8–9 and
IMPLEMENTATION_PLAYBOOK sections 2–3 and 8), plus `research/premium-ui-ux` beside it.

## Evidence and remaining limits

See [QA](../../design-qa.md#opening-scroll-morph),
[six scroll stages](evidence/morph-contact-sheet.png), and
[original/implemented endpoint comparison](evidence/comparison-morph-endpoints.png).
All four tested viewport sizes have identical final endpoint captures to the
original static images. The endpoints use those original images intentionally;
intermediate frames were separately inspected for movement and shape alignment.

Production Edge checks cover reverse/fast scroll, resizing mid-morph, restored hash
entry, moving link activation, live reduced motion, no-JavaScript entry, repeated
locale changes, route cleanup and emulated touch swipe/tap. Physical touch devices,
Safari/Firefox and screen-reader audio were not available. No claim is made about
frame rates across other hardware. The previous design/content review items remain.
