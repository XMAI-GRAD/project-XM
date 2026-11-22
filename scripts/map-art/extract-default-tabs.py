"""Extract inactive theme tags from web final-04.svg (pass its path as argument).

Keep the designer's filled contours and seashell symbols. Labels stay localized
HTML; the existing web final-12 artwork remains the selected button state.
"""

from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE_HASH = "eccbecd0d573c020d726fb6885f90d3056279910252b84f945fca8b5986c9f1d"
source = Path(sys.argv[1]).read_bytes()
if sha256(source).hexdigest() != SOURCE_HASH:
    raise SystemExit("Source changed: review the extraction paths before regenerating.")

NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
root = ET.fromstring(source)
rules = {
    name: dict(re.findall(r"([\w-]+)\s*:\s*([^;]+)", body))
    for name, body in re.findall(r"\.([\w-]+)\s*\{([^}]+)\}", root.find(f"{{{NS}}}style").text)
}
for element in root.iter():
    for name in element.get("class", "").split():
        for key, value in rules.get(name, {}).items():
            if key != "enable-background":
                element.set(key, value)
    element.attrib.pop("class", None)


def emit(name, box, path):
    element = root
    for index in path.split("/"):
        element = element[int(index)]
    svg = ET.Element(f"{{{NS}}}svg", {
        "viewBox": " ".join(map(str, box)), "fill": "none",
    })
    svg.append(deepcopy(element))
    ET.ElementTree(svg).write(
        ROOT / "public/maps/v2" / f"{name}.svg", encoding="utf-8", xml_declaration=False,
    )


# Match the selected tabs' 92 x 57.6 canvas, with .6 units around the contour.
emit("tab-place-default", [1329.9, 1336.9, 92, 57.6], "222/2")
emit("tab-taste-default", [1451.4, 1336.9, 92, 57.6], "222/1")
emit("tab-craft-default", [1572.5, 1336.9, 92, 57.6], "222/0")
emit("tab-place-symbol", [1347.7, 1359.5, 15.1, 9.5], "222/5/1")
emit("tab-taste-symbol", [1477.6, 1360.9, 12.5, 9.5], "222/4/1")
# The craft group repeats underneath; extract only its visible seashell copy.
emit("tab-craft-symbol", [1579.6, 1359.6, 15, 9.6], "222/3/1/1")
