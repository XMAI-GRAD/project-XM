# Road names and landmarks on the supplied drawing

**16 November:** the saved-route UI and label layer are implemented in the real map. See [integration behavior, data contract and checks](../../docs/map-routing/INTEGRATION.md). The four archived paths are the current directed coverage; all other pairs have an explicit unavailable state. The owner requested a commit, not a push.

Researched and prototyped personally on 9 November 2026. The user's current preference is to explore **saved routes** and sourced geographic context before adding a live routing service. ORS remains a possible generation/live provider; an API key is not required to view a saved route on Leaflet.

The inspectable implementation and provenance are in [docs/map-labels](../../docs/map-labels/README.md). Its local preview on port 4319 compares the untouched drawing against geographic vector geometry: nine named roads, three source landmarks, two canonical entrances and one saved walking route around Hoàng thành–Văn Miếu.

## Keep these responsibilities distinct

| Responsibility           | Source / implementation                                 | What it does not establish                                                   |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Interactions and drawing | Existing Leaflet CRS.Simple image layer                 | Street names, routing graph or geographic correctness by itself              |
| Alignment                | Existing calibrated Mercator-to-image affine transform  | Survey accuracy everywhere or alignment of any arbitrarily distorted drawing |
| Road names and geometry  | Archived OSM-derived OpenMapTiles data from OpenFreeMap | Government authority, current access rules or raw OSM object IDs             |
| Landmark context         | Reviewed source POI class/name/coordinate               | Public entrance or walkable destination                                      |
| Saved route              | Dated provider walking geometry, distance and estimate  | Live closures or turn instructions absent from the response                  |
| Readable labels          | Source-line candidates and screen collision rules       | Changes to underlying geography                                              |

## Result

The unchanged calibration maps the source network onto recognizable roads in the supplied artwork. Retaining the artwork while supplying sourced names, landmarks and routes is feasible. Local offsets and omitted paths remain; this is not a numerical route-wide accuracy claim. Higher-resolution/vector artwork would improve close-zoom presentation, not automatically geographic accuracy.

The proof uses two archived PBF tiles (1.155 MB), copied road names and raw tile hashes. Overpass failed with overload/timeouts, so the source is explicitly a processed, dated tile snapshot. Read [OpenFreeMap's quick start](https://openfreemap.org/quick_start/), [terms](https://openfreemap.org/tos/), [OSM licensing](https://www.openstreetmap.org/copyright) and the manifest before expanding. Geographic links to OSM provide context; PBF indexes are not OSM IDs.

## Saved-route implications

A finite catalogue can request/review routes during content preparation, then serve geometry as local data. With 12 destinations, all ordered pairs total 12 × 11 = 132 routes. That is possible but **not generated or authorized as this task's scope**. Begin with a small reviewed set. Return directions can have different access/maneuvers; reversing a polyline is not a separately verified return route.

Store mode, endpoint IDs/access coordinates, provider, source request, fetched/reviewed time, geometry, distance/duration, attribution/license and review status. Store maneuver data only if obtained and validated. Entrance updates must invalidate affected routes for review. Treat absent routes explicitly; never auto-connect endpoints or missing geometry across gaps.

Road/landmark labels support orientation; they do not replace maneuvers. The central sample used `steps=false`, so it has no turn instructions. A road near the route is not necessarily used by it. Later route-aware labels should prioritize roads demonstrably used by the geometry or provider steps, while retaining wider city context.

This research does not amend SPEC or implement full directions. Keep geography, routes and presentation independently reviewable. The canonical 12 places remain in `data/points`; added road context should not become extra visitor destinations.
