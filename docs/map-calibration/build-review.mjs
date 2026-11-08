// Run from the repository root:
// node --conditions=react-server --experimental-strip-types docs/map-calibration/build-review.mjs <OSM-extract.json>
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  getPage,
  points,
  mapCalibration,
  mapTransform,
} from "../../src/content/index.ts";
import { projectToArtwork } from "../../src/features/maps/georeference.ts";

const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
const sharp = nextRequire("sharp");
const out = fileURLToPath(new URL("./", import.meta.url));
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const artwork = getPage("maps").artwork;
const rows = [
  ...mapCalibration.controls.map((p) => ({ ...p, role: "control" })),
  ...mapCalibration.checks.map((p) => ({ ...p, role: "check" })),
].map((p) => {
  const result = projectToArtwork(p.coordinates, mapTransform);
  return {
    ...p,
    projected: result,
    error: Math.hypot(result.x - p.image.x, result.y - p.image.y),
  };
});
const checks = rows.filter((p) => p.role === "check");
const rms = Math.sqrt(
  checks.reduce((s, p) => s + p.error ** 2, 0) / checks.length,
);
const maximum = Math.max(...checks.map((p) => p.error));
let roads = "";
if (process.argv[2]) {
  const osm = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  roads = osm.elements
    .filter((e) => e.tags?.highway && e.geometry?.length)
    .map((e) => {
      const p = e.geometry.map(({ lat, lon }) =>
        projectToArtwork({ latitude: lat, longitude: lon }, mapTransform),
      );
      if (
        !p.some(
          ({ x, y }) =>
            x >= 0 && x <= artwork.width && y >= 0 && y <= artwork.height,
        )
      )
        return "";
      return `<path d="M${p.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}"/>`;
    })
    .join("");
} else {
  const old = fs.existsSync(out + "review.html")
    ? fs.readFileSync(out + "review.html", "utf8")
    : "";
  roads =
    old.match(
      /<!--REFERENCE-ROADS-->([\s\S]*?)<!--END-REFERENCE-ROADS-->/,
    )?.[1] ?? "";
}

const anchors = rows
  .map((p) => {
    const color = p.role === "control" ? "#273991" : "#008b86";
    return `<g><title>${esc(p.id + ": " + p.name + " — " + p.error.toFixed(2) + " px")}</title><circle cx="${p.image.x}" cy="${p.image.y}" r="7" fill="white" stroke="${color}" stroke-width="2"/><path d="M${p.projected.x - 4},${p.projected.y}h8m-4,-4v8" stroke="${color}" stroke-width="1.5"/><text x="${p.image.x + 11}" y="${p.image.y - 10}" font-size="16" font-weight="700" fill="${color}" paint-order="stroke" stroke="white" stroke-width="4">${p.id}</text></g>`;
  })
  .join("");
const pins = points
  .filter((p) => p.mapPosition)
  .map((p) => {
    const { x, y } = p.mapPosition;
    const left = p.layer !== "taste";
    return `<g><title>${esc(p.name.vi + " — " + p.mapLocation.label.vi)}</title><circle cx="${x}" cy="${y}" r="13" fill="#0d1855" stroke="#fec35a" stroke-width="4"/><text x="${x}" y="${y + 4}" fill="white" font-size="11" font-weight="700" text-anchor="middle">${p.code.toUpperCase()}</text><text x="${x + (left ? -20 : 20)}" y="${y - 17}" font-size="19" font-weight="700" text-anchor="${left ? "end" : "start"}" fill="#0d1855" paint-order="stroke" stroke="white" stroke-width="5">${esc(p.name.vi)}</text></g>`;
  })
  .join("");
const overlay = `<defs><clipPath id="map-clip"><rect width="${artwork.width}" height="${artwork.height}"/></clipPath></defs><g clip-path="url(#map-clip)"><g id="roads" fill="none" stroke="#b72662" stroke-width="1" opacity=".55"><!--REFERENCE-ROADS-->${roads}<!--END-REFERENCE-ROADS--></g><g id="anchors">${anchors}</g><g id="pins">${pins}</g></g>`;
const table = rows
  .map(
    (p) =>
      `<tr><td><a href="${esc(p.source)}">${p.id}</a></td><td>${esc(p.name)}</td><td>${p.role}</td><td>${p.coordinates.latitude}, ${p.coordinates.longitude}</td><td>${p.image.x}, ${p.image.y}</td><td>${p.error.toFixed(2)}</td></tr>`,
  )
  .join("");
const pointTable = points
  .filter((p) => p.mapPosition)
  .map(
    (p) =>
      `<tr><td>${esc(p.name.vi)}</td><td>${esc(p.mapLocation.label.vi)}</td><td>${p.mapPosition.x.toFixed(1)}, ${p.mapPosition.y.toFixed(1)}</td><td><a href="${esc(p.mapLocation.source)}">Source</a></td></tr>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hanoi map alignment review</title><style>
*{box-sizing:border-box}body{margin:0;background:#fff6f1;color:#0d1855;font:15px/1.5 system-ui,sans-serif}main{max-width:1700px;margin:auto;padding:24px}h1{font-size:30px;margin:0 0 8px}h2{font-size:22px;margin-top:30px}p{max-width:1000px}fieldset{display:flex;align-items:center;gap:24px;flex-wrap:wrap;border:1px solid #0d1855;padding:12px;margin:20px 0}label{display:flex;align-items:center;gap:8px}input{accent-color:#273991}a{color:inherit}svg{display:block;width:100%;height:auto;background:white;border:1px solid #0d1855;font-family:Arial,sans-serif}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #b6bbd0;padding:8px}th{background:#e1e7f2}.table{overflow:auto}.note{border-left:4px solid #008b86;padding-left:14px}footer{margin-top:24px;font-size:13px}
</style><main><h1>Hanoi map alignment review</h1><p>Measured ${mapCalibration.researchedOn}. Eight control junctions define the transformation. Four additional junctions check it: <strong>RMS ${rms.toFixed(2)} px; maximum ${maximum.toFixed(2)} px</strong> on the original ${artwork.width} × ${artwork.height} artwork.</p><p class="note">These errors measure agreement between manually identified junctions and OSM. They are not a surveyed GPS or entrance-accuracy guarantee. Blue circles: controls; teal circles: checks; crosses: calculated positions; navy/gold markers: the three current destinations.</p><fieldset><legend>Compare the drawing with the reference</legend><label><input id="show-roads" type="checkbox" checked> OSM roads</label><label>Road opacity <input id="opacity" type="range" min="0" max="100" value="55"></label><label><input id="show-anchors" type="checkbox" checked> Calibration landmarks</label><label><input id="show-pins" type="checkbox" checked> Destination pins</label></fieldset>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${artwork.width} ${artwork.height}" role="img" aria-label="Original Hanoi artwork with measured landmarks, projected OSM roads and destination pins"><image href="../../public${artwork.src}" width="${artwork.width}" height="${artwork.height}"/>${overlay}</svg>
<h2>Destination positions</h2><div class="table"><table><thead><tr><th>Place</th><th>What the pin represents</th><th>Artwork pixels (x, y)</th><th>Reference</th></tr></thead><tbody>${pointTable}</tbody></table></div>
<h2>Measurements</h2><p>Click a landmark ID to inspect its OSM node. Checkpoints are excluded from the fitted transformation. Pixel coordinates start at the image's top-left.</p><div class="table"><table><thead><tr><th>ID</th><th>Junction</th><th>Role</th><th>Latitude, longitude</th><th>Measured pixels</th><th>Error (px)</th></tr></thead><tbody>${table}</tbody></table></div><footer>Reference road geometry and landmark coordinates: <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors, ODbL</a>. Artwork supplied by the project owner. Bà Đức's business pin comes from the owner's shared map link. No live map service is called by this review.</footer></main><script>
const byId=id=>document.getElementById(id);for(const name of ['roads','anchors','pins'])byId('show-'+name).addEventListener('change',event=>{byId(name).style.display=event.target.checked?'':'none'});byId('opacity').addEventListener('input',event=>{byId('roads').style.opacity=event.target.value/100});
</script></html>`;
fs.writeFileSync(out + "review.html", await format(html, { parser: "html" }));

const width = artwork.width,
  top = 115,
  height = artwork.height + top + 70;
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g font-family="Arial,sans-serif"><text x="24" y="38" font-size="29" font-weight="700" fill="#0d1855">Hanoi map — alignment review</text><text x="24" y="68" font-size="18" fill="#0d1855">8 controls · 4 independent checks · RMS ${rms.toFixed(2)} px · maximum ${maximum.toFixed(2)} px · ${mapCalibration.researchedOn}</text><text x="24" y="94" font-size="16" fill="#0d1855">Blue: controls · teal: checks · magenta: OSM roads · navy/gold: sourced destination pins</text><g transform="translate(0,${top})">${overlay}</g><text x="24" y="${height - 38}" font-size="15" fill="#0d1855">Reference: © OpenStreetMap contributors (ODbL). Artwork supplied by project owner.</text><text x="24" y="${height - 15}" font-size="15" fill="#0d1855">Pixel fit measures drawing alignment. Hoàng thành: entrance · Ngũ Xã: communal house · Bà Đức: shared business pin.</text></g></svg>`;
await sharp({ create: { width, height, channels: 3, background: "#fff6f1" } })
  .composite([
    { input: "public" + artwork.src, left: 0, top },
    { input: Buffer.from(foreground), left: 0, top: 0 },
  ])
  .png()
  .toFile(out + "review.png");
fs.writeFileSync(
  out + "measurements.json",
  await format(
    JSON.stringify(
      {
        researchedOn: mapCalibration.researchedOn,
        artwork: mapCalibration.artwork,
        transform: mapTransform,
        independentCheckRmsPixels: rms,
        independentCheckMaxPixels: maximum,
        landmarks: rows,
      },
      null,
      2,
    ),
    { parser: "json" },
  ),
);
console.log(
  JSON.stringify(
    {
      rms,
      maximum,
      pins: points
        .filter((p) => p.mapPosition)
        .map((p) => ({ slug: p.slug, position: p.mapPosition })),
    },
    null,
    2,
  ),
);
