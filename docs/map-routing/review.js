/* global L */
"use strict";
const { artwork, samples } = JSON.parse(
  document.getElementById("review-data").textContent,
);
const byId = (id) => document.getElementById(id);
const bounds = L.latLngBounds([0, 0], [artwork.height, artwork.width]);
const map = L.map("map", {
  crs: L.CRS.Simple,
  zoomControl: false,
  attributionControl: false,
  keyboard: false,
  scrollWheelZoom: false,
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false,
  minZoom: -5,
  maxZoom: 4,
  maxBounds: bounds.pad(0.5),
});
L.imageOverlay("../../public" + artwork.src, bounds).addTo(map);
const overlay = L.layerGroup().addTo(map);
let line, halo, selected;
function fit() {
  map.fitBounds(L.latLngBounds(selected.leaflet), {
    padding: [65, 65],
    maxZoom: 3,
    animate: false,
  });
}
function appearance() {
  const opacity = byId("show-route").checked
    ? Number(byId("opacity").value) / 100
    : 0;
  line.setStyle({ opacity });
  halo.setStyle({ opacity: opacity ? 0.85 : 0 });
}
function select(id) {
  selected = samples.find((s) => s.id === id);
  overlay.clearLayers();
  halo = L.polyline(selected.leaflet, {
    color: "#fff",
    weight: 6,
    interactive: false,
  }).addTo(overlay);
  line = L.polyline(selected.leaflet, {
    color: "#0d1855",
    weight: 2.5,
    interactive: false,
  }).addTo(overlay);
  byId("endpoints").replaceChildren();
  selected.endpoints.forEach((endpoint, i) => {
    const letter = i === 0 ? "A" : "B";
    const requested = [artwork.height - endpoint.pixel.y, endpoint.pixel.x];
    const snapped = i === 0 ? selected.leaflet[0] : selected.leaflet.at(-1);
    L.polyline([requested, snapped], {
      color: "#b7262a",
      weight: 2,
      dashArray: "3 4",
      interactive: false,
    }).addTo(overlay);
    L.marker(requested, {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "endpoint-label",
        html: letter,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    }).addTo(overlay);
    L.circleMarker(snapped, {
      radius: 4,
      color: "white",
      weight: 1,
      fillColor: "#008b86",
      fillOpacity: 1,
      interactive: false,
    }).addTo(overlay);
    const tr = document.createElement("tr");
    const name = document.createElement("td"),
      kind = document.createElement("td"),
      gap = document.createElement("td");
    const source = document.createElement("a");
    source.href = endpoint.source;
    source.textContent = `${letter} · ${endpoint.code.toUpperCase()} · ${endpoint.name}`;
    name.append(source);
    kind.textContent = `${endpoint.kind} — ${endpoint.label.en || endpoint.label.vi}`;
    gap.textContent = `${selected.endpointGapsMeters[i].toFixed(1)} m`;
    tr.append(name, kind, gap);
    byId("endpoints").append(tr);
  });
  byId("summary").textContent =
    `Walking sample · ${(selected.distanceMeters / 1000).toFixed(2)} km · about ${Math.round(selected.durationSeconds / 60)} min · ${selected.pixels.length} vertices · ${selected.outsideVertexCount} outside artwork`;
  byId("caution").textContent =
    selected.id === "bridge"
      ? "The Long Biên destination is a representative point on the bridge, not a verified pedestrian entrance. Do not ship this as an access recommendation."
      : selected.id === "outer"
        ? "Vạn Phúc is a representative village point. Inspect the southwest stretch carefully: it extends beyond the original control-point footprint. Access and local artwork distortion remain separate checks."
        : selected.id === "lake"
          ? "Ngọc Sơn is a representative temple point. The route ends on the mapped path; ticketed access and gates are not verified by this response."
          : "Both requested points are sourced entrance references. The graph reaches them closely, but gate operation and real walking access still need confirmation.";
  byId("raw").href = `samples/${selected.id}.json`;
  appearance();
  fit();
}
for (const sample of samples) {
  const option = document.createElement("option");
  option.value = sample.id;
  option.textContent = sample.endpoints
    .map((e) => `${e.code.toUpperCase()} ${e.name}`)
    .join(" → ");
  byId("route").append(option);
}
byId("route").addEventListener("change", (event) => select(event.target.value));
byId("fit").addEventListener("click", fit);
byId("overview").addEventListener("click", () =>
  map.fitBounds(bounds, { animate: false }),
);
byId("show-route").addEventListener("change", appearance);
byId("opacity").addEventListener("input", appearance);
byId("zoom-in").addEventListener("click", () =>
  map.zoomIn(1, { animate: false }),
);
byId("zoom-out").addEventListener("click", () =>
  map.zoomOut(1, { animate: false }),
);
for (const button of document.querySelectorAll("[data-pan]"))
  button.addEventListener("click", () =>
    map.panBy(button.dataset.pan.split(",").map(Number), { animate: false }),
  );
byId("map").addEventListener("keydown", (event) => {
  const delta = {
    ArrowLeft: [-120, 0],
    ArrowRight: [120, 0],
    ArrowUp: [0, -120],
    ArrowDown: [0, 120],
  }[event.key];
  if (delta) {
    event.preventDefault();
    map.panBy(delta, { animate: false });
  } else if (["+", "=", "-"].includes(event.key)) {
    event.preventDefault();
    map.setZoom(map.getZoom() + (event.key === "-" ? -1 : 1), {
      animate: false,
    });
  }
});
select(samples[0].id);
