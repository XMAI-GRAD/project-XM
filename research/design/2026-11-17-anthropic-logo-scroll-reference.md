# Anthropic logo collapse/expansion — recording study

Source supplied by the owner: `C:\Users\Minh\Videos\2026-11-17 00-59-15.mp4`.
Inspected personally on 17 November 2026: 9.8 seconds, 1920×1080. Forty overview
samples were followed by 71 close-up samples of collapse/expansion at approximately
1/60-second intervals. Sampling frequency is not a claim about the recording's
native frame rate. This study concerns the supplied recording, not a live-site
implementation audit.

Source SHA256: `8E6C4ACD227D6FA3F537F91AEA68570C769B408A11FA7E83E2B3A95CAE52B444`.

## Observed motion

The centered header wordmark changes between full ANTHROPIC lettering and a
compact mark consisting of an A and a diagonal stroke. The article scrolls beneath
the header; the navigation stays present. The logo's vertical position and glyph
height remain almost constant throughout the change.

On collapse, the A advances inward while the other letters begin fading. Once
those letters are nearly gone, the retained A and diagonal stroke close the gap
between them and settle into the compact mark. These phases overlap slightly;
the recorded motion is not a rigid fade-then-move sequence.

On expansion, the A and diagonal separate first. The remaining lettering stays
hidden through most of that separation, then fades back in as the pieces approach
their expanded positions. Identifiable shapes remain visible during the entire
change, giving the eye a continuous object to follow.

The logo has the same header slot in both states. Its visible ink is not perfectly
centered at every intermediate frame: it briefly shifts right during collapse and
left during expansion because the pieces move and fade at different times.
Do not require the bounding box of all visible ink to remain centered throughout.

## Timing and measurements

- The sampled collapse runs approximately 3.35–3.90 seconds into the recording.
- The sampled expansion runs approximately 7.78–8.25 seconds.
- Fully expanded dark-ink width is approximately 142 recorded pixels; collapsed
  width is about 22 pixels. Dark-ink height is about 15 pixels in both states,
  with vertical bounds around y=118–132.
- These are thresholded video-pixel measurements, not CSS dimensions. Compression,
  antialiasing, recording scaling and fading affect the measured bounds.

The passes suggest a short eased transition between states triggered by scrolling.
The video does not establish the exact trigger, scroll threshold, easing curve,
or whether animation progress is directly scrubbed, smoothed, or time-driven.
The expansion accompanies a return toward the top; do not assume any upward scroll
at any document position must trigger it without checking the actual implementation.

## Application to our extracted SVG workflow

A reproduction could keep the retained pieces and remaining lettering in separate
SVG groups, animate horizontal translations and opacity on one reversible GSAP
timeline, and preserve the glyph height/stroke weight. This is an implementation
proposal inferred from the visible effect, not a claim about Anthropic's code.
The reference does not require uniform whole-logo scaling or a change of path
topology to explain its appearance.

For Hanoi Creative City, identify the persistent brand shapes before choosing a
compact state. Keep the team's extractor as the source of geometry and add semantic
group hooks through its manifest. Use independent timing for movement and lettering
visibility, handle interruptions/reversal on the same timeline, preserve the real
accessible logo link, and provide the static reduced-motion state. This reference
does not by itself authorize replacing the current opening-to-header sequence.

## Evidence

- [Selected collapse/expansion frames](evidence/anthropic-logo-scroll/logo-sequence-overview.png)
- [Dense collapse frames](evidence/anthropic-logo-scroll/logo-collapse-contact.png)
- [Dense expansion frames](evidence/anthropic-logo-scroll/logo-expand-contact.png)
- [Approximate ink bounds](evidence/anthropic-logo-scroll/logo-measurements.json)

Evidence images show only the logo region, cropped from x=745, y=96, width=260,
height=64 in the supplied recording. The full video and desktop overview frames
were not added to the project. No application code was changed for this study.

Subsequent owner-authorized implementation:
[Hanoi Creative City header brand collapse](2026-11-17-header-brand-collapse.md).
It retains our roof symbol and preserves the existing opening sequence.
