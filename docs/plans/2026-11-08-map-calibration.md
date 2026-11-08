# Map calibration — 8 November 2026

Goal: replace provisional pin placement with a documented comparison between the supplied artwork and OpenStreetMap. Keep SPEC.md unchanged as requested.

- Identify matching landmarks across the artwork and a bounded OSM reference extract.
- Record image pixels and reference coordinates, fit a transformation, and check independent landmarks.
- Verify destination identities and distinguish venue entrances from representative area points.
- Update only positions supported by the comparison; document uncertainty and coverage limits.
- Save a reviewable comparison and the measurements used. Validate affected code and content.

The existing PNG remains the displayed map. Reference services are used for research, not added as runtime dependencies.

Result: eight controls and four separate check junctions are recorded in `data/map-calibration.yaml`; the maximum check error is 2.13 source-image pixels. All three seeded destinations now use sourced coordinates, including Bà Đức's business pin supplied by the user. See `docs/map-calibration/README.md` and its review artifacts for evidence and limits. The remaining nine content entries are a separate follow-up.
