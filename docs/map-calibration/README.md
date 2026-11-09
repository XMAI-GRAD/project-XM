# Hanoi artwork calibration

Measured on 8 November 2026. [Interactive comparison](review.html) · [Review image](review.png) · [Measurements](measurements.json).

The supplied 1618 × 1020 PNG aligns closely with central Hanoi's OSM road geometry using an affine transformation. Eight manually matched junctions define the transformation; four additional junctions are excluded from the fit and used to check it. Their RMS error is **1.64 original-image pixels**, with a **2.13-pixel maximum**. This measures drawing-to-reference alignment, not surveyed accuracy or proof of a doorway's location. OSM accuracy, artwork detail, manual landmark measurement, and individual place references remain separate uncertainties.

## Original calibration destinations

| Destination            | Geographic reference (latitude, longitude) | Derived artwork position (x, y) | What the pin represents                                              |
| ---------------------- | ------------------------------------------ | ------------------------------- | -------------------------------------------------------------------- |
| Hoàng thành Thăng Long | 21.0336597, 105.8391421                    | 1059.2, 232.7                   | OSM's tagged main visitor entrance on Hoàng Diệu                     |
| Bún thang Bà Đức       | 21.0323458, 105.852837                     | 1216.5, 248.8                   | The business pin shared by the project owner; not a surveyed doorway |
| Ngũ Xã                 | 21.0463247, 105.8407432                    | 1077.6, 76.3                    | Đình Ngũ Xã, a representative landmark for the craft village         |

The previous hand-estimated pixels were removed. These three locations live in their canonical `data/points/*.yaml` entries. `src/content/` calculates image positions from those coordinates and the calibration. The follow-up dataset task added the other nine destinations; all 12 fit inside this artwork. See the [complete location/source register](../map-locations/README.md) and the regenerated [interactive review](review.html) for their placements and limitations. The original three coordinates and the fitted calibration remain unchanged.

## Place evidence

- **Hoàng thành:** [OSM entrance node 6539666886](https://www.openstreetmap.org/node/6539666886) is tagged `entrance=main` and described as the official citadel entrance. The venue's own [tour description](https://hoangthanhthanglong.vn/tour-dem-giai-ma-hoang-thanh-thang-long-2/) identifies 19C Hoàng Diệu as the arrival gate. [A 2026 venue announcement](https://hoangthanhthanglong.vn/chuong-trinh-vui-tet-trung-thu-2026/) also gives that address.
- **Bà Đức:** [Vietnam Tourism](https://vietnam.travel/node/1305) confirms 48 Cầu Gỗ. The project owner supplied [this business pin](https://maps.app.goo.gl/gybVwccQ2BEVsKDUA). Its redirect identifies Bún Thang Bà Đức and encodes the destination as `!3d21.0323458!4d105.852837`. The separate `@21.0323278,105.8527418` value is the camera centre and was **not** used. The bounded OSM queries did not identify this business or a number-48 address point, so no OSM business match is claimed.
- **Ngũ Xã:** [OSM way 700671931](https://www.openstreetmap.org/way/700671931) identifies Đình Ngũ Xã at 16 Nguyễn Khắc Hiếu. Its bounding-box centre is used as an area landmark, not an entrance. The Hanoi culture authority's [heritage inventory](https://sovhtt.hanoi.gov.vn/wp-content/uploads/2016/01/QDPQ_24_2015.pdf) lists Đình Ngũ Xã in Trúc Bạch. The on-site card explicitly identifies the representative landmark.

## Method and reproducibility

1. Download a bounded OSM main-road and named-water extract through the read-only Overpass API. Inspect its geometry against the supplied artwork. A coarse visual placement and a road-distance comparison helped identify matching intersections; neither supplies the final fitted coefficients.
2. Measure 12 junction positions on magnified crops of the **original PNG**, and record their matching OSM node IDs. The measurements and their roles are saved in `data/map-calibration.yaml`. Eight controls enter the fit; four checks do not.
3. Convert latitude/longitude to local EPSG:3857 metres around latitude 21, longitude 105.8. Fit an affine mapping from those metres to original-image pixels by least squares. Image x increases rightward; image y increases downward.
4. Evaluate the four check landmarks, inspect the road overlay, then project the sourced destination coordinates. The PNG itself is not warped or recoloured by this process.
5. Bind calibration to the source image's SHA-256 and dimensions. Content validation fails if the artwork changes, coordinates are invalid, controls cannot define a transformation, or an independent check exceeds the configured 6-pixel limit. Locations outside the artwork remain in the list without an invented pin.

`src/features/maps/georeference.ts` contains the projection and fit. `src/content/index.ts` loads and validates the canonical data. No network request, API key, geocoder, or tile service is added to the website runtime.

To regenerate the review from the repository root:

```powershell
node --conditions=react-server --experimental-strip-types docs/map-calibration/build-review.mjs
```

Use Node 24 for this offline tool. The generator reads content through `src/content/` and reuses the reference road paths embedded in the existing HTML. `load-content.mjs` supplies a narrowly scoped Node loader for the Turbopack raw-YAML glob, then runs the app's actual parsing, validation and projection module. The loader is only used by this documentation tool and does not change the website's live-reload path. To refresh the road reference, pass a saved Overpass JSON extract as the final argument. It uses the image renderer already installed with Next.js; no project dependency was added for this task. Use the following query at `https://overpass-api.de/api/interpreter`:

```overpass
[out:json][timeout:45];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"]
    (20.96,105.73,21.08,105.92);
  way["natural"="water"]["name"](20.96,105.73,21.08,105.92);
);
out geom;
```

The HTML comparison works locally and loads the original PNG by a relative file path. Toggle the OSM overlay or change its opacity to compare streets; calibration IDs link to their reference nodes. The generated PNG is the static review artifact. Regenerate these artifacts whenever calibration or destination coordinates change. The build script does not modify content.

## Limits and next work

- The four checks test only sampled locations. They do not establish a uniform error bound for every street, particularly near the edges or outside the control-point footprint.
- A representative village point, business point, and visitor entrance are different things. Their placement kinds and human-readable descriptions are recorded separately.
- Existing artistic pins remain approximate at street scale. There is no live navigation, GPS tracking, or route calculation in this change.
- All 12 destination references are now documented. Several are explicitly representative village/area points, and Vạn Phúc lies outside the original control-point footprint. These references still need route-access verification before use as navigation endpoints.
- Before drawing an API route, validate additional points along that route. A small error at a few junctions does not prove that a route follows every drawn street or that the artwork reflects current access restrictions.

Reference geometry and control coordinates: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. The interactive and PNG reviews retain attribution. The artwork was supplied by the project owner. The Bà Đức reference was supplied by the project owner as a map link.
