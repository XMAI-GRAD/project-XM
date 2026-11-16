# Routes on the Hanoi artwork

**16 November implementation:** saved directions and central road/landmark labels are now integrated into `/vi/maps` and `/en/maps`. Read [the current integration handoff](../../docs/map-routing/INTEGRATION.md). Four saved directed paths are available; live ORS integration is optional future work, not a prerequisite for this release. The research below records the earlier provider investigation.

Researched and tested personally on **9 November 2026**. No sub-agents. This research is inside the Git repository so it can travel with a future commit; nothing has been pushed. The older graphics/UX libraries remain in the sibling workspace `research/` directory.

## Decision

**Later user direction:** investigate saved routes and source-backed road/landmark labels first. A working proof is in [docs/map-labels](../../docs/map-labels/README.md); read [the saved-route and label handoff](LABELS_AND_SAVED_ROUTES.md). The live-service recommendation below is retained for a possible later need, not a current API-key prerequisite.

Use **openrouteservice (ORS), through our Next.js server, as the first live-service candidate**. Keep the existing Leaflet image map and transform the returned geographic route into its image coordinates. Request walking routes first, with explicit origin and destination chosen from the curated places. This is a recommendation supported by documentation, not a claim that an authenticated ORS request has already passed.

The geometry proof uses **four saved FOSSGIS OSRM walking responses**. It needs no account and makes no external requests when viewed. That proves the projection/rendering approach with real routes; it does not validate ORS's graph, credentials, latency or Hanoi endpoint choices. Do not wire the public OSRM demonstration service into production by default.

## Service comparison

| Option                      | Current evidence                                                                                                                                                                            | Fit for this project                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ORS / HeiGIT                | Standard: €0, 2,000 Directions requests/day, 40/minute. One account per person. Results have attribution and CC BY-SA 4.0 requirements.                                                     | Best initial candidate for a small academic project; API key, server integration and live Hanoi checks remain.                              |
| GraphHopper                 | Free: 500 credits/day, non-commercial only, limited profiles. Basic: €69/month before VAT, 5,000 credits/day. Its product page explicitly allows any map and states worldwide OSM coverage. | Credible alternative if ORS fails practical checks or future needs justify a paid plan. Credits are not universally equivalent to requests. |
| FOSSGIS OSRM public service | Worldwide car/bike/foot graphs. Maximum one request/second, attribution and application identification; no scraping or heavy use.                                                           | Used only for four explicit research samples. Not a reliability commitment for our public site.                                             |
| Self-hosted engine          | We operate the routing graph, updates, resources and uptime.                                                                                                                                | Keeps infrastructure under our control but adds substantial operations work for this project. Defer until hosted services are inadequate.   |

Sources: [HeiGIT plans](https://account.heigit.org/info/plans), [HeiGIT service terms](https://account.heigit.org/info/tos), [GraphHopper pricing](https://www.graphhopper.com/pricing/), [GraphHopper product/coverage](https://www.graphhopper.com/), [FOSSGIS service policy and setup](https://routing.openstreetmap.de/about.html). The HeiGIT plans and terms were read in a rendered browser because they are JavaScript pages; the plain web extractor returned no text.

Map loads and route requests are separate operations. Loading our static artwork, panning or switching categories should make **zero directions requests**. A new, uncached route calculation uses the selected provider's quota. Visitors share the application's service allowance; do not treat it as a per-visitor allowance. Debounce/explicit submission, caching and request deduplication belong in the live implementation.

## Current API details that older tutorials miss

Use `https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson`. Send the key in the server's `Authorization` header. ORS accepts POST requests that return a GeoJSON FeatureCollection; its route geometry is a LineString and its summary reports metres and seconds. [Directions response documentation](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types).

The old `api.openrouteservice.org` host is deprecated. The forum migration notice and later HeiGIT announcement give differing shutdown dates; the 22 October announcement says the week of 16 November. We need not depend on either date: use the new host. [Migration specification](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912/), [later HeiGIT announcement](https://heigit.org/changes-in-the-openrouteservice-universe/).

The status page listed Foot Walking as operational when read, but there were recent walking-timeout reports and recorded incidents. This warrants a bounded timeout, a useful retry state and a real authenticated Hanoi check before adoption; a green status page alone does not prove our requests work. [Provider status](https://status.heigit.org/), [first-hand October timeout reports](https://ask.openrouteservice.org/t/foot-walking-foot-hiking-hang-on-api-heigit-org-cycling-regular-driving-car-works/8097).

## Custom artwork and licensing

HeiGIT's terms require ORS attribution and license results under CC BY-SA 4.0. They allow attribution in the map or elsewhere on the property and prohibit transmitting personal data. Our proposed initial requests contain only two curated public-place coordinates. Browser geolocation and arbitrary personal addresses are separate future decisions. Keep the required credit with displayed results and retained route data; do not infer that the route-result license automatically determines the license of the entire application. [Current terms](https://account.heigit.org/info/tos).

**Inference:** the explicit route-result license and standalone GeoJSON output support displaying routes over our own artwork; there is no required ORS basemap in the terms read. GraphHopper states custom-map compatibility explicitly. For our four OSRM samples, preserve OSRM/FOSSGIS credit, OSM attribution, the ODbL link and the fix-the-map link. The provider's English policy excerpt was readable; its linked full German policy returned an anti-bot denial, so this review does not claim to have read that full page. [OSM attribution/license](https://www.openstreetmap.org/copyright), [FOSSGIS excerpt](https://routing.openstreetmap.de/about.html).

## How the implementation works

The basemap renderer and route engine are independent. Leaflet already displays the original `1618 × 1020` PNG with `CRS.Simple`. A routing service supplies the ordered path, not the map artwork.

1. Resolve two validated slugs through `src/content/`; obtain reviewed access coordinates. A place's display pin is not automatically its routing entrance.
2. Request a mode-specific route. **GeoJSON orders coordinates as `[longitude, latitude]`.** Do not confuse it with Leaflet's geographic `[latitude, longitude]` convention.
3. Pass each geographic vertex through `projectToArtwork`. It projects relative Web Mercator coordinates through the existing affine fit, giving top-left-origin image pixels `(x, y)`.
4. In our existing Leaflet image convention, use `[artwork.height - y, x]`. Draw `L.polyline` in the same map instance as the image. Feed image coordinates, never raw geographic degrees, to that `CRS.Simple` layer.
5. Use provider distance/duration for the route summary. Pixel distance is not ground distance. The prototype's haversine endpoint gaps are diagnostics, not additional walkable segments or route-length replacements.

The public OSRM service has separate preprocessed foot/car/bike backends. Changing a URL word from `driving` to `foot` on an arbitrary car server does not rebuild its graph as a walking graph. Our sample requests use the operator's actual `routed-foot` backend, `overview=full`, `geometries=geojson` and a bounded 100 m snapping radius. [Operator configuration](https://github.com/fossgis-routing-server/osrm-frontend/blob/gh-pages/src/leaflet_options.js), [OSRM API](https://project-osrm.org/docs/v5.24.0/api/).

The projection helper rejects malformed, nonfinite, reversed Hanoi coordinates and oversized geometry. It preserves every vertex and flags out-of-artwork geometry. Dropping outside vertices could create a false straight connection between otherwise separate visible pieces. A later UI must deliberately handle partial routes and clipping.

## What the four real samples established

| Saved sample                              | Returned length / walking estimate | Requested-pin gaps at A / B | Geometric result         |
| ----------------------------------------- | ---------------------------------- | --------------------------- | ------------------------ |
| Hoàng thành → Văn Miếu                    | 968.3 m / 13 min                   | 0.035 / 0.033 m             | 81 vertices, all inside  |
| Bà Đức → Ngọc Sơn                         | 314.8 m / 4 min                    | 11.47 / 15.01 m             | 47 vertices, all inside  |
| Văn Miếu → Vạn Phúc                       | 9,823.8 m / 131 min                | 0.033 / 18.33 m             | 479 vertices, all inside |
| Đồng Xuân reference → Long Biên reference | 1,246.8 m / 17 min                 | 17.12 / 2.95 m              | 41 vertices, all inside  |

These are dated research outputs, not current travel promises. See [saved responses and numerical diagnostics](../../docs/map-routing/measurements.json) and the [interactive review](../../docs/map-routing/review.html).

**Observed visually:** broad corridors correspond well enough to demonstrate the overlay. High zoom exposes local offsets and image softness. Some detailed pedestrian geometry has no corresponding stroke on the drawing, most visibly the Ngọc Sơn approach. The whole route can therefore be mathematically projected correctly without tracing every grey line. The route must not be warped or replaced by invented straight segments to hide that difference. The temple is on an island reached by a bridge, which the official tourism reference independently describes; that fact does not validate every service vertex. [Vietnam Tourism](https://vietnam.travel/things-to-do/11-must-see-attractions-ha-noi/).

**Not established:** a route-wide pixel-error bound, surveyed accuracy, universal entrance access, all 132 ordered place pairs, ORS/GraphHopper live response quality, or accessibility of the actual walking surfaces. Vạn Phúc extends beyond the original fit-control footprint. The previous 2.13 px maximum applied only to the four old checkpoints and must not be advertised as a bound for these routes.

Văn Miếu has different entrance and exit addresses; its official site distinguishes them. A route starting outside the main entrance is different from a visitor departing through an exit after a visit. Do not silently change the existing artwork pin to serve both purposes. [Venue visitor information](https://www.vanmieu.gov.vn/en).

## Next implementation contract

Keep service-specific code behind a small server adapter. Initially accept only `{ fromSlug, toSlug, mode: "walking" }`, validate both slugs, reject identical endpoints, and resolve data through the content loader. Keep the key server-only (`ORS_API_KEY`, never `NEXT_PUBLIC_*`). Do not accept arbitrary URLs or provider credentials from the browser.

Return normalized geometry, distance in metres, duration in seconds, provider attribution, fetched time and endpoint diagnostics. Validate the provider response before projection. Do not return raw upstream errors or secret-bearing request information. Use a bounded timeout; distinguish invalid input, missing configuration, no route, quota exhaustion and upstream failure.

Proposed UX: two labelled selectors spanning all 12 places, swap, an explicit route action, clear route, a visible mode, distance/time and a route-specific fit action. Preserve the existing three categories, search, cards and keyboard behavior. Keep pending/failed input separate from the last successful route; an older response must never overwrite a newer selection. Abort obsolete requests, retain accessible focus, announce status politely and offer retry on user action. Both dictionaries must contain the final UI strings.

Cache only within the applicable result-license requirements and make freshness explicit. Cache keys must include provider, profile, endpoint coordinates/access-version and relevant route options; language alone should not multiply geometry requests. A process-local map cannot enforce a shared quota across serverless instances. Select a shared limiter/cache before making the endpoint public; a client-only throttle is insufficient.

Before live integration is considered complete: obtain a project-owned ORS key, test actual Hanoi walking responses on the new host, check intended access points (especially bridge/village/temple cases), agree how to present routes across missing artwork detail, then verify UI and service-failure behavior. No account, key, paid plan or deployment was created in this task.

## Agent handoff

Read this note, `docs/map-routing/README.md`, the dated plan and `AGENTS.md`. Preserve SPEC.md per the owner's instruction; reconcile spec conflicts later. Reuse the saved responses for UI/geometry tests instead of hitting a public endpoint in CI. No production adapter, arbitrary A-to-B interface, or real-time navigation has been shipped yet. The pure projection helper is ready for reuse; its service input still needs a validated server wrapper.
