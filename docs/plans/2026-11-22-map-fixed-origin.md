# Fixed university origin

Add the configured Hanoi Architectural University starting point to the map,
using the list ID badge contour and the exact HÀ NỘI heading red (#B5262A).
The badge reads Bạn/You; its persistent label identifies the starting point and
university. Keep it independent of the 5/4/3 theme lists, searches and selections.
Retain the existing directions origin at 20.981012, 105.7892685.

The display anchor (330, 590) is authored in the new illustration's Nguyễn Trãi /
Hà Đông area. It is separate from geographic coordinates and is not a calibrated
campus entrance. No old pixel positions or route geometry are projected at runtime.
The university's [contact page](https://hau.edu.vn/gioi-thieu_c180601/Lien-he_n315.html)
identifies the Hà Đông / Nguyễn Trãi–Trần Phú campus. The existing configured
coordinate and Google Maps source URL are unchanged.

Implementation reuses list-badge.svg, passes the canonical origin through the
server content boundary, and validates its authored anchor against artwork bounds.
The extraction manifest retains the new display anchor when regenerated. No new
geolocation request, destination record, or route is introduced.

Validate VI/EN, desktop/mobile, all themes, empty searches, selections/directions,
pan/zoom/reset and motion preferences. Keep labels clear of the card and legend.
Preserve SPEC under its free-form map section. Local changes only; no commit/push.
