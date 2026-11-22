"""Extract reusable card artwork from the supplied web final-18.svg export."""

from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

source = Path(sys.argv[1]).read_bytes()
if sha256(source).hexdigest() != "21a164a06273320dc6348abbcf1872e923d02f1926d35fa5b9cfd458460d8c33":
    raise SystemExit("Source changed: review the extraction paths before regenerating.")

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
root = ET.fromstring(source)
rules = {
    name: dict(re.findall(r"([\w-]+)\s*:\s*([^;]+)", body))
    for name, body in re.findall(r"\.([\w-]+)\s*\{([^}]+)\}", root[0].text)
}
for element in root.iter():
    for name in element.get("class", "").split():
        for key, value in rules.get(name, {}).items():
            if key != "enable-background":
                element.set(key, value)
    element.attrib.pop("class", None)

out = Path(__file__).resolve().parents[2] / "public/maps/v2"

def emit(name, box, paths, mask=False):
    svg = ET.Element(f"{{{SVG}}}svg", {"viewBox": box, "fill": "none"})
    for path in paths:
        element = root
        for index in path.split("/"):
            element = element[int(index)]
        element = deepcopy(element)
        if mask:
            element.set("fill", "white")
        svg.append(element)
    ET.ElementTree(svg).write(out / f"{name}.svg", encoding="utf-8")

emit("card-frame", "574 178.1 314.5 415.1", ["1"])
emit("card-close", "805.9 186.8 39 39", ["12"])
emit("card-photo-mask", "576.7 231.9 308.9 95", ["13/0/0"], mask=True)
emit("card-photo-rule", "576 231.2 310.3 96.4", ["2", "3"])
emit("card-badge", "814.1 489.4 30.3 38.7", ["6/0"], mask=True)
print("Extracted five reusable card assets.")
