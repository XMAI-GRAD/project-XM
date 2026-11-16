/* Research-only page. No app state, API key, live tiles or routing requests. */
(async function () {
  const L = window.L;
  const $ = (id) => document.getElementById(id);
  try {
    const response = await fetch("review-data.json");
    if (!response.ok)
      throw new Error("Reference data unavailable; rebuild the review");
    const data = await response.json();
    const height = data.artwork.height;
    const artPoint = (p) => L.latLng(height - p.y, p.x);
    const geoPoint = (p) => L.latLng(p[1], p[0]);
    const options = {
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      scrollWheelZoom: false,
      inertia: false,
    };
    const art = L.map("art-map", {
      ...options,
      crs: L.CRS.Simple,
      minZoom: -1,
      maxZoom: 5,
    });
    const geo = L.map("geo-map", { ...options, minZoom: 13, maxZoom: 20 });
    art.attributionControl.setPrefix(false);
    geo.attributionControl.setPrefix(false);
    for (const map of [art, geo])
      map.attributionControl.addAttribution(
        'Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · OpenFreeMap / OpenMapTiles',
      );
    const image = L.imageOverlay("/hanoi-map.png", [
      [0, 0],
      [height, data.artwork.width],
    ]).addTo(art);
    image.on("error", () => {
      $("error").hidden = false;
      $("error").textContent =
        "The original drawing could not load. Reload after checking the local image asset.";
    });
    const surfaces = [
      {
        id: "art",
        map: art,
        point: (f) => artPoint(f.pixel),
        line: (f) => f.pixels.map((line) => line.map(artPoint)),
      },
      {
        id: "geo",
        map: geo,
        point: (f) => geoPoint(f.coordinates),
        line: (f) => f.lines.map((line) => line.map(geoPoint)),
      },
    ];
    let selected = "road-0";
    const roadFeatures = data.features.filter((f) => f.kind === "road");
    for (const f of data.features) {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = `${f.kind === "entrance" ? f.badge + " · Entrance" : f.kind === "road" ? "Road" : "Landmark"} · ${f.name}`;
      $("feature").append(option);
    }
    for (const surface of surfaces) {
      const { map, id } = surface;
      const background = data.background.map((r) =>
        id === "art" ? r.pixels.map(artPoint) : r.coordinates.map(geoPoint),
      );
      surface.background = L.polyline(background, {
        color: id === "art" ? "#008b86" : "#b5bdc3",
        weight: id === "art" ? 1 : 1.4,
        opacity: id === "art" ? 0.22 : 0.75,
        interactive: false,
      }).addTo(map);
      surface.roads = new Map();
      for (const f of roadFeatures) {
        const line = L.polyline(surface.line(f), {
          weight: 2.5,
          color: "#008b86",
          opacity: 0.65,
          bubblingMouseEvents: false,
        }).addTo(map);
        line.on("click", () => choose(f.id, false));
        surface.roads.set(f.id, line);
      }
      const routeLine =
        id === "art"
          ? data.route.pixels.map(artPoint)
          : data.route.coordinates.map(geoPoint);
      surface.route = [
        L.polyline(routeLine, {
          color: "white",
          weight: 7,
          opacity: 0.95,
          interactive: false,
        }).addTo(map),
        L.polyline(routeLine, {
          color: "#0d1855",
          weight: 3.5,
          opacity: 0.9,
          interactive: false,
        }).addTo(map),
      ];
      surface.markers = new Map();
      for (const f of data.features.filter((item) => item.kind !== "road")) {
        const marker =
          f.kind === "entrance"
            ? L.marker(surface.point(f), {
                icon: L.divIcon({
                  className: "entrance-icon",
                  html: f.badge,
                  iconSize: [27, 27],
                  iconAnchor: [13.5, 13.5],
                }),
                title: `${f.badge}: ${f.name} entrance`,
                alt: `${f.name} entrance`,
                keyboard: true,
              })
            : L.circleMarker(surface.point(f), {
                radius: 4,
                color: "#fff",
                weight: 2,
                fillColor: "#b7262a",
                fillOpacity: 1,
              });
        marker.on("click", () => choose(f.id, false));
        marker.addTo(map);
        surface.markers.set(f.id, marker);
      }
      const labelLayer = document.createElement("div");
      labelLayer.className = "label-layer";
      labelLayer.setAttribute("aria-hidden", "true");
      map.getContainer().append(labelLayer);
      surface.labelLayer = labelLayer;
      surface.labels = data.features
        .filter((f) => f.kind !== "entrance")
        .map((f) => {
          const el = document.createElement("span");
          el.className = `map-label ${f.kind === "landmark" ? "landmark" : ""}`;
          el.textContent = f.name;
          el.dataset.feature = f.id;
          labelLayer.append(el);
          return { f, el };
        });
      map.on("move zoom resize", () => renderLabels(surface));
    }
    function tangentPoints(surface, f) {
      if (surface.id === "geo")
        return f.tangent.map((p) =>
          surface.map.latLngToContainerPoint(geoPoint(p)),
        );
      // Source tangent endpoints already occur in one of the projected polylines.
      const points = f.tangent.map((p) => {
        for (let i = 0; i < f.lines.length; i++) {
          const index = f.lines[i].findIndex(
            (q) => q[0] === p[0] && q[1] === p[1],
          );
          if (index >= 0)
            return surface.map.latLngToContainerPoint(
              artPoint(f.pixels[i][index]),
            );
        }
        return surface.map.latLngToContainerPoint(surface.point(f));
      });
      return points;
    }
    function renderLabels(surface) {
      const { map } = surface;
      const size = map.getSize(),
        boxes = [];
      // Reserve the zoom controls, source attribution and actual entrance markers.
      boxes.push(
        { left: 0, top: 0, right: 48, bottom: 88 },
        { left: 0, top: size.y - 20, right: size.x, bottom: size.y },
      );
      for (const f of data.features.filter((p) => p.kind === "entrance")) {
        const p = map.latLngToContainerPoint(surface.point(f));
        boxes.push({
          left: p.x - 18,
          top: p.y - 18,
          right: p.x + 18,
          bottom: p.y + 18,
        });
      }
      const priority = (f) =>
        f.id === selected
          ? -10
          : f.kind === "landmark"
            ? 0
            : Number(f.id.split("-")[1]) + 1;
      let visible = 0;
      for (const { f, el } of [...surface.labels].sort(
        (a, b) => priority(a.f) - priority(b.f),
      )) {
        el.hidden = !$("show-labels").checked;
        if (el.hidden) continue;
        el.classList.toggle("selected", f.id === selected);
        let placed = false;
        for (const candidate of f.candidates ?? [f]) {
          const positioned = { ...f, ...candidate };
          const p = map.latLngToContainerPoint(surface.point(positioned));
          const offsetY = f.kind === "landmark" ? -20 : -9;
          let angle = 0;
          if (f.kind === "road") {
            const [a, b] = tangentPoints(surface, positioned);
            angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
            if (angle > 90) angle -= 180;
            if (angle < -90) angle += 180;
          }
          el.style.left = `${p.x}px`;
          el.style.top = `${p.y + offsetY}px`;
          el.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
          const radians = (angle * Math.PI) / 180;
          const w =
            Math.abs(el.offsetWidth * Math.cos(radians)) +
            Math.abs(el.offsetHeight * Math.sin(radians));
          const h =
            Math.abs(el.offsetWidth * Math.sin(radians)) +
            Math.abs(el.offsetHeight * Math.cos(radians));
          const box = {
            left: p.x - w / 2 - 3,
            right: p.x + w / 2 + 3,
            top: p.y + offsetY - h / 2 - 3,
            bottom: p.y + offsetY + h / 2 + 3,
          };
          const inside =
            box.left >= 3 &&
            box.right <= size.x - 3 &&
            box.top >= 3 &&
            box.bottom <= size.y - 3;
          const collision = boxes.some(
            (b) =>
              box.left < b.right &&
              box.right > b.left &&
              box.top < b.bottom &&
              box.bottom > b.top,
          );
          if (inside && !collision) {
            boxes.push(box);
            visible++;
            placed = true;
            break;
          }
        }
        el.hidden = !placed;
      }
      $(`${surface.id}-count`).textContent =
        `${visible} / 12 names visible · zoom to reveal`;
    }
    function refresh() {
      const enabled = $("show-roads").checked;
      const opacity = Number($("opacity").value) / 100;
      for (const surface of surfaces) {
        surface.background.setStyle({
          opacity: surface.id === "art" ? (enabled ? opacity * 0.35 : 0) : 0.75,
        });
        for (const [id, layer] of surface.roads)
          layer.setStyle({
            color: id === selected ? "#b7262a" : "#008b86",
            weight: id === selected ? 3.5 : 2,
            opacity: surface.id === "art" && !enabled ? 0 : opacity,
          });
        surface.route.forEach((line, i) =>
          line.setStyle({
            opacity: $("show-route").checked ? (i === 0 ? 0.95 : 0.9) : 0,
          }),
        );
        renderLabels(surface);
      }
    }
    function choose(id, centre = true) {
      selected = id;
      $("feature").value = id;
      const f = data.features.find((item) => item.id === id);
      $("evidence-title").textContent = f.name;
      $("coordinates").textContent =
        `${f.coordinates[0].toFixed(7)}, ${f.coordinates[1].toFixed(7)}`;
      $("pixels").textContent =
        `${f.pixel.x.toFixed(2)}, ${f.pixel.y.toFixed(2)} (top-left origin)`;
      $("feature-note").textContent =
        f.kind === "road"
          ? "Name copied from the source. These coordinates identify the midpoint of its longest cropped line. Labels can move along that same source line to avoid collisions; red paths show the road geometry."
          : f.kind === "entrance"
            ? f.description
            : `Source landmark point (${f.sourceClass}); this is not a verified visitor entrance.`;
      $("source-ref").textContent = f.sourceRefs
        ? f.sourceRefs
            .map((r) => `${r.tile} / ${r.layer} / feature ${r.index}`)
            .join("; ")
        : f.source;
      $("source-link").href = f.sourceRefs
        ? `source-tiles/${f.sourceRefs[0].tile}.pbf`
        : f.source;
      $("source-link").textContent = f.sourceRefs
        ? "Raw source tile (PBF)"
        : "OSM entrance record";
      $("osm-link").href =
        `https://www.openstreetmap.org/?mlat=${f.coordinates[1]}&mlon=${f.coordinates[0]}#map=18/${f.coordinates[1]}/${f.coordinates[0]}`;
      if (centre)
        for (const surface of surfaces)
          surface.map.panTo(surface.point(f), { animate: false });
      refresh();
      // A short selected street may have its label obscured by an entrance at
      // overview scale. Inspect it closer rather than placing its name elsewhere.
      if (centre && f.kind === "road" && $("show-labels").checked) {
        for (const surface of surfaces) {
          const label = surface.labels.find((item) => item.f.id === id);
          for (let attempt = 0; attempt < 4 && label.el.hidden; attempt++) {
            surface.map.setZoom(surface.map.getZoom() + 0.5, {
              animate: false,
            });
            renderLabels(surface);
          }
        }
      }
    }
    function fit() {
      const [west, south, east, north] = data.bbox;
      geo.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [18, 18], animate: false },
      );
      const all = data.background.flatMap((r) => r.pixels.map(artPoint));
      art.fitBounds(L.latLngBounds(all), { padding: [18, 18], animate: false });
      refresh();
    }
    $("feature").addEventListener("change", () => choose($("feature").value));
    $("fit").addEventListener("click", fit);
    for (const id of ["show-roads", "show-labels", "show-route", "opacity"])
      $(id).addEventListener("input", refresh);
    for (const toolbar of document.querySelectorAll(".map-actions")) {
      const map = toolbar.dataset.map === "art" ? art : geo;
      for (const button of toolbar.querySelectorAll("button"))
        button.addEventListener("click", () =>
          map.panBy(button.dataset.pan.split(",").map(Number), {
            animate: false,
          }),
        );
    }
    const observer = new ResizeObserver(() => {
      art.invalidateSize({ animate: false });
      geo.invalidateSize({ animate: false });
    });
    observer.observe($("art-map"));
    observer.observe($("geo-map"));
    fit();
    choose(selected, false);
  } catch (error) {
    $("error").hidden = false;
    $("error").textContent = error.message;
    console.error(error);
  }
})();
