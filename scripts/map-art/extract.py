"""Extract source vectors; stdlib only. Run with the supplied SVG path as argument.

Raw design files stay outside the repository. Output is reusable source artwork,
not a raster screenshot. The manifest's paths deliberately bind to this export.
"""

from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE_HASH = "e3336e70d76534ac6c1eaad8b4e33409cd2b39fc140484c7b4057738919b02f1"
source = Path(sys.argv[1]).read_bytes()
if sha256(source).hexdigest() != SOURCE_HASH:
    raise SystemExit("Source changed: review the extraction paths before regenerating.")
ET.register_namespace("", "http://www.w3.org/2000/svg")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
root = ET.fromstring(source)
css = root.find("{http://www.w3.org/2000/svg}style").text
rules = {
    name: dict(re.findall(r"([\w-]+)\s*:\s*([^;]+)", body))
    for name, body in re.findall(r"\.([\w-]+)\s*\{([^}]+)\}", css)
}
for element in root.iter():
    for name in element.get("class", "").split():
        for key, value in rules.get(name, {}).items():
            if key != "enable-background":
                element.set(key, value)
    element.attrib.pop("class", None)

def at(path):
    el = root
    for index in path.split("/"):
        el = el[int(index)]
    return deepcopy(el)

out = ROOT / "public/maps/v2"
out.mkdir(parents=True, exist_ok=True)

def emit(name, box, paths):
    svg = ET.Element("{http://www.w3.org/2000/svg}svg", {
        "viewBox": " ".join(map(str, box)), "fill": "none",
    })
    for path in paths:
        svg.append(at(path))
    ET.ElementTree(svg).write(out / (name + ".svg"), encoding="utf-8", xml_declaration=False)

emit("page-frame", [0, 0, 1920, 1672.5], ["7", "8", "9", "10"])
emit("explorer-frame", [221, 600.4, 1479.9, 700.1], ["12/0"])
emit("heading", [278, 341.6, 426.6, 210.7], ["15", "16", "46"])
emit("heading-rule", [704.6, 364.4, 688.5, 20], ["17"])
emit("map-base", [597, 610, 1094, 680], ["12/1/0", "12/1/1"] + [f"12/1/{i}" for i in range(7, 13)])
emit("map-mask", [597, 610, 1094, 680], ["12/1/0/0/0"])
# Alpha masks reuse the exact source contours, including the concave corners.
mask_path = out / "map-mask.svg"
mask = ET.parse(mask_path)
mask.getroot()[0].set("fill", "white")
mask.write(mask_path, encoding="utf-8", xml_declaration=False)
emit("sidebar-mask", [232.4, 609.9, 360.7, 680.6], ["13", "14", "18"])
emit("compass", [645.1, 645.3, 79, 84.4], [f"12/1/{i}" for i in range(2, 7)])
emit("centre", [900.9, 946.4, 19, 18.9], [f"12/1/{i}" for i in range(7, 10)])
emit("legend", [1341.6, 1097.4, 314.5, 157.4], [f"12/1/{i}" for i in range(25, 28)])
emit("search-frame", [245.2, 668.2, 330.9, 45.1], ["28/2"])
emit("tab-place", [245.2, 746.8, 92, 57.6], ["28/8"])
emit("tab-taste", [366.7, 746.8, 92, 57.6], ["28/7"])
emit("tab-craft", [487.8, 746.8, 92, 57.6], ["28/6"])
emit("pin-place", [1277, 788.5, 26.4, 16.7], ["12/1/13"])
emit("pin-taste", [1406.8, 894.5, 21.9, 16.7], ["12/1/18"])
emit("pin-craft", [1380.9, 762, 26.5, 16.7], ["12/1/22"])
emit("list-badge", [279.7, 945.1, 30.4, 38.8], ["31"])
emit("row-arrow", [557, 962.6, 8, 7.5], ["24"])
emit("sidebar-decoration", [412.6, 1119.9, 180.6, 170.5], ["23"])

# Design pins are visual anchors, not geographic controls. These are the source
# symbols' centres relative to the cropped map-base viewBox.
pins = {
    "d01": [1344.9, 748.65], "d02": [1290.2, 796.85],
    "d03": [1420.4, 804.85], "d04": [1431.7, 758.8],
    "d05": [1425.4, 694.55], "v01": [1419.3, 772.45],
    "v02": [1417.75, 902.85], "v03": [905, 736.05],
    "v04": [1391.7, 750.45], "n01": [1331.05, 656.45],
    "n02": [1394.15, 770.35], "n03": [634.85, 1241.25],
}
manifest = {
    "sourceSha256": SOURCE_HASH,
    "coordinateSpace": "designer-artwork",
    "artwork": {"src": "/maps/v2/map-base.svg", "width": 1094, "height": 680},
    "pins": {k: {"x": round(x - 597, 2), "y": round(y - 610, 2)} for k, (x, y) in pins.items()},
    "origin": {
        "latitude": 20.981012, "longitude": 105.7892685,
        "name": {"vi": "Trường Đại học Kiến trúc Hà Nội", "en": "Hanoi Architectural University"},
        "sourceUrl": "https://www.google.com/maps/search/?api=1&query=20.981012%2C105.7892685",
    },
}
(ROOT / "data/map-design.yaml").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"Extracted 20 source assets and the authored pin manifest into {out}")
