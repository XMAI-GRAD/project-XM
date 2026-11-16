"""Extract original Illustrator vectors; no paths are redrawn.

Usage: python scripts/extract-home-art.py "path/to/WEB-02.svg" "path/to/WEB-01.svg"
Requires only Python's standard library. Source files remain outside this repo.
"""
import copy
import hashlib
import json
import re
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
source = Path(sys.argv[1])
expected = '5c6622fd682e1803419d0d19efe73295a9f2504bd529dc2130bdbb43cdaa7e6c'
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected, 'Source changed: remeasure node selections before exporting.'
root = ET.parse(source).getroot()
tags = {'g','path','rect','polygon','polyline','circle','ellipse','line','text','image','use'}
nodes = [e for e in root.iter() if e.tag.split('}')[-1] in tags]
style = root.find(f'{{{SVG}}}style').text
out = Path(__file__).resolve().parents[1] / 'public' / 'home'
out.mkdir(parents=True, exist_ok=True)
# Source node indices refer to document order for the tags above. Bounds were
# measured from the SVG, not from a resized screenshot. ViewBox crops preserve
# the original coordinates, clipping paths, opacity and Illustrator geometry.
assets = {
    'logo': ([758], [860.22,45.73,198.87,85.83]),
    'menu-mark': ([957], [47.82,361.72,84.3,84.31]),
    'frame': ([889,938], [0,180,1920,5220]),
    'search-outline': ([80], [1401.03,67.06,339.97,47.23]),
    'hero-art': ([806,935,*range(944,957)], [179.65,257.96,1560.35,880.54]),
    'hanoi-title': ([*range(967,977),1001,1002], [477.02,380.52,948.78,158.7]),
    'hero-tagline': ([977], [933.65,613.36,491.58,37.95]),
    'connections-title': ([1048,1174], [222.93,1189.28,1483.31,78.5]),
    'connections-art': ([1015], [567.24,1319.87,785.1,783.97]),
    'join-mark': ([634], [303.42,1977.72,113.58,56.51]),
    'infrastructure-ribbon': ([79], [179.03,2160.17,1560.97,256.42]),
    'libraries': ([222], [375.65,2199.84,133.13,92.06]),
    'universities': ([185], [705.04,2219.4,133.16,72.49]),
    'theatres': ([201], [1062.81,2200.459,133.73,91.531]),
    'cinemas': ([211], [1395.08,2218,133.18,73.07]),
    'roles-art': ([1078,1169,1172,300,1202], [179.65,2557.46,1567.23,786.911]),
    'heritage-title': ([301], [632.22,3402.19,1022.43,325.7]),
    'wave-mark': ([1173], [180.07,3399.87,328.71,72.94]),
    'threads-title': ([65,*range(714,722),722,1201], [223.74,4457.3,480.01,134.6]),
    'place': ([613], [1206.9,4466.57,446.73,282.95]),
    'taste': ([616], [826.09,4717.23,371.77,282.95]),
    'craft': ([619], [1206.9,4967.88,448.59,283.89]),
    'map-mark': ([629], [228.12,4999.89,113.64,77.271]),
    'place-connector': ([643], [821.44,4481,376.72,19.89]),
    'taste-connector': ([645], [1279.73,4855.66,381.41,19.95]),
    'craft-connector': ([644], [822.31,5144.82,375.22,19.95]),
}
manifest = {'source': 'WEB-02.svg', 'sourceSha256': expected, 'artboard': [1920,5400], 'assets': {}}
for name,(indices,box) in assets.items():
    svg = ET.Element(f'{{{SVG}}}svg', {'viewBox':' '.join(map(str,box)), 'width':str(box[2]), 'height':str(box[3])})
    if name == 'search-outline':
        svg.set('preserveAspectRatio', 'none')
    elements = [copy.deepcopy(nodes[i]) for i in sorted(indices)]
    classes = set()
    for element in elements:
        for child in element.iter(): classes.update(child.attrib.get('class','').split())
    css = '\n'.join(rule for rule in re.findall(r'\.[\w-]+\s*\{[^}]*\}',style) if rule.split('{')[0].strip()[1:] in classes)
    ET.SubElement(svg,f'{{{SVG}}}style').text = css
    for element in elements: svg.append(element)
    content = ET.tostring(svg,encoding='unicode')
    (out / f'{name}.svg').write_text(content+'\n',encoding='utf8')
    manifest['assets'][name] = {'src':f'/home/{name}.svg','width':box[2],'height':box[3],'sourceBounds':box,'sourceNodes':indices}
notes = out.parents[1] / 'research' / 'design'
opening_source = Path(sys.argv[2]) if len(sys.argv) > 2 else source.with_name('WEB-01.svg')
opening_hash = '7ce0d495bff45626f7ba0e278082d18321b486d4700ccc499bfda18fe4c20097'
assert hashlib.sha256(opening_source.read_bytes()).hexdigest() == opening_hash, 'Opening source changed: remeasure before exporting.'
opening_root = ET.parse(opening_source).getroot()
opening_nodes = [e for e in opening_root.iter() if e.tag.split('}')[-1] in tags]
opening_group = copy.deepcopy(opening_nodes[6])
opening_box = [774.624, 402.881, 370.737, 274.228]
opening_classes = {c for e in opening_group.iter() for c in e.attrib.get('class', '').split()}
opening_style = opening_root.find(f'{{{SVG}}}style').text
opening_css = '\n'.join(rule for rule in re.findall(r'\.[\w-]+\s*\{[^}]*\}', opening_style) if rule.split('{')[0].strip()[1:] in opening_classes)
opening_svg = ET.Element(f'{{{SVG}}}svg', {'viewBox': ' '.join(map(str, opening_box)), 'width': str(opening_box[2]), 'height': str(opening_box[3])})
ET.SubElement(opening_svg, f'{{{SVG}}}style').text = opening_css
opening_svg.append(opening_group)
(out / 'opening-logo.svg').write_text(ET.tostring(opening_svg, encoding='unicode') + '\n', encoding='utf8')
manifest['additionalSources'] = {'WEB-01.svg': {'sha256': opening_hash, 'artboard': [1922.42, 1080]}}
manifest['assets']['opening-logo'] = {'src': '/home/opening-logo.svg', 'width': opening_box[2], 'height': opening_box[3], 'source': 'WEB-01.svg', 'sourceBounds': opening_box, 'sourceNodes': [6]}
notes.mkdir(parents=True,exist_ok=True)
(notes/'homepage-asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Extracted {len(manifest["assets"])} original vector assets; {sum(p.stat().st_size for p in out.glob("*.svg")):,} bytes.')
