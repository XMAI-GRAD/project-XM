# The 12 Hanoi map locations

Completed from the owner's **NỘI DUNG WEB HANOI CREATIVE CITY · bản 07/11/2026** PDF on 8 November 2026. The canonical application data is in `data/points/place.yaml`, `taste.yaml` and `craft.yaml`; all app consumers still read it through `src/content/`.

The document was read in full. Destination pages 5–9 and the English appendix on page 12 were also rendered and inspected. Vietnamese stories, hooks, facts, addresses and nearby relationships come from those pages. Line wrapping and quotation marks were normalized; the missing space after a comma in V02's hook was repaired. No new historical story or nearby distance was invented.

## Source and completeness

| Code | Destination                 | PDF page | Geographic reference                                                     | Placement                                                           |
| ---- | --------------------------- | -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| D01  | Hoàng thành Thăng Long      | 5        | [OSM node 6539666886](https://www.openstreetmap.org/node/6539666886)     | Existing visitor entrance on Hoàng Diệu; retained unchanged         |
| D02  | Văn Miếu – Quốc Tử Giám     | 5        | [OSM node 7202796990](https://www.openstreetmap.org/node/7202796990)     | Main entrance on Quốc Tử Giám                                       |
| D03  | Hồ Hoàn Kiếm – Đền Ngọc Sơn | 6        | [OSM way 178995262](https://www.openstreetmap.org/way/178995262)         | Representative point at Ngọc Sơn Temple                             |
| D04  | Phố cổ 36 phố phường        | 6        | [OSM way 1212230635](https://www.openstreetmap.org/way/1212230635)       | Representative point at Đồng Xuân Market                            |
| D05  | Cầu Long Biên               | 6        | [OSM way 874082896](https://www.openstreetmap.org/way/874082896)         | Bridge footprint reference, explicitly not a bridge entrance        |
| V01  | Bún thang Bà Đức            | 7        | [Owner-supplied business pin](https://maps.app.goo.gl/gybVwccQ2BEVsKDUA) | Existing business point; retained unchanged                         |
| V02  | Chè Mười Sáu                | 7        | [OSM node 5385333722](https://www.openstreetmap.org/node/5385333722)     | Business point explicitly tagged 16 Ngô Thì Nhậm                    |
| V03  | Cốm làng Vòng               | 7–8      | [OSM way 1507523027](https://www.openstreetmap.org/way/1507523027)       | Representative point at the Làng Cốm Vòng gate, not a vendor        |
| V04  | Chả cá Lã Vọng              | 8        | [OSM node 11491397157](https://www.openstreetmap.org/node/11491397157)   | Business point explicitly tagged 14 phố Chả Cá                      |
| N01  | Ngũ Xã                      | 8        | [OSM way 700671931](https://www.openstreetmap.org/way/700671931)         | Existing representative point at Đình Ngũ Xã; retained unchanged    |
| N02  | Hàng Trống                  | 8–9      | [OSM way 701882971](https://www.openstreetmap.org/way/701882971)         | Representative exhibition landmark at Đình Nam Hương, 75 Hàng Trống |
| N03  | Vạn Phúc                    | 9        | [OSM node 5725274622](https://www.openstreetmap.org/node/5725274622)     | Representative village point in Hà Đông, not an individual workshop |

New OSM references were read from bounded Overpass queries. Relevant returned records are retained in [osm-references.json](osm-references.json), including the source extract timestamps. For ways, coordinates are the bounding-box centres returned by `out center`, not surveyed entrances or geometric centroids. Node coordinates are used directly. N03's OSM node cites historical cartography; it supports an approximate village reference, not a current doorway.

## Geographic corroboration

- The venue's [visitor information](https://www.vanmieu.gov.vn/en/introduction/visitor-information) identifies Văn Miếu's main entrance at 58 Quốc Tử Giám and distinguishes the exits on Văn Miếu Street. The chosen OSM node is tagged `entrance=main` on the south side of that complex. The venue page also supports the source PDF's daytime hours and standard ticket price as checked during this task.
- Hanoi's culture authority documents Hàng Trống-related exhibitions at [Đình Nam Hương, 75 Hàng Trống](https://sovhtt.hanoi.gov.vn/trung-bay-cac-tac-pham-son-mai-va-lua-lay-cam-hung-tu-tranh-dan-gian-hang-trong/). This is evidence for a representative public cultural landmark, not a claim that an exhibition is running today. The article was available through the search index; direct retrieval timed out.
- The national tourism authority's [Làng Vòng entry](https://vietnamtourism.vn/index.php/tourism/items/1817/12) establishes the village's Cầu Giấy identity. The point uses OSM's specifically named village gate rather than an arbitrary food shop or the centre of a modern administrative ward.
- Hanoi's official tourism portal identifies [Vạn Phúc silk village](https://hanoigo.hanoi.gov.vn/destination/lang-lua-van-phuc) and its village landmarks. Care was taken not to confuse it with the unrelated Đình Vạn Phúc OSM entry in Ba Đình.
- V02 and V04 business-point tags match the street numbers in the supplied content document. These are map database references, not independently surveyed doorways or proof of current business hours.

All 12 points project inside the original 1618 × 1020 artwork. Vạn Phúc projects to approximately **(329.5, 891.4)**, so it can appear on this drawing. The artwork, fitted transform, original controls and check landmarks were not moved to accommodate it. The [calibration review](../map-calibration/review.html) shows all 12 coded positions and their source links.

The previously measured 2.13-pixel maximum check error applies to the four original check junctions, not to every new destination. Vạn Phúc lies outside the original control-point footprint. A source-backed geographic position does not by itself prove uniform drawing accuracy there. Treat all pins as artwork references; verify walkable access points and route alignment before implementing directions, especially for the bridge and area/village representatives.

## Editorial and asset limits

- **English:** names/dish labels explicitly supplied by the appendix were entered. Other English prose remains empty and uses the existing Vietnamese fallback. The full English craft labels include the craft wording exactly as the appendix does. Geographic placement notes are bilingual UI explanations, not translations of the editorial stories.
- **Photos/audio:** the nine added entries use `images: []`; no unlicensed photo or fake filename was added. Existing three cover placeholders were preserved. Home and map components already have fallbacks for absent images. No audio asset was supplied.
- **Hours/prices:** `[GĐ]` markers are preserved as comments on the affected YAML fields. Except for the independently corroborated Văn Miếu visitor information, these values remain source-document reference copy requiring editorial confirmation. They are not live business data. This task does not certify the historical claims in the supplied prose either.
- **Nearby:** all named nearby relationships from the PDF now resolve to real slugs, including links missing from the three original seeds. Distances are copied editorial approximations, not walking-route measurements. V03 and N03 have empty nearby arrays because the PDF supplies no named nearby destination for either; N03's distance from central Hanoi is not a nearby-place link.
- **Routing:** no routing provider, API key, runtime geocoder or map tile service was added.

Reference coordinates: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. The V01 business point and artwork were supplied by the owner. Source snapshot records support this authored dataset; they are not a second application data source.
