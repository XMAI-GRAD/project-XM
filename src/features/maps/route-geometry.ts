import {
  projectToArtwork,
  validCoordinates,
  type ArtworkTransform,
  type Coordinates,
} from "./georeference.ts";

/** GeoJSON uses longitude first. CRS.Simple pixels are not geographic degrees. */
export function readRouteLineString(value: unknown): Coordinates[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    value.type !== "LineString" ||
    !("coordinates" in value) ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length < 2 ||
    value.coordinates.length > 20000
  ) {
    throw new Error("Expected a route LineString with 2–20000 coordinates");
  }
  return value.coordinates.map((position: unknown) => {
    if (
      !Array.isArray(position) ||
      position.length < 2 ||
      position.length > 3 ||
      position.some(
        (n: unknown) => typeof n !== "number" || !Number.isFinite(n),
      )
    ) {
      throw new Error("Invalid GeoJSON route position");
    }
    const point = { longitude: position[0], latitude: position[1] };
    if (!validCoordinates(point))
      throw new Error("Invalid geographic route position");
    return point;
  });
}

/** Approximate ground separation for endpoint diagnostics, never route length. */
export function endpointDistanceMeters(a: Coordinates, b: Coordinates): number {
  if (!validCoordinates(a) || !validCoordinates(b))
    throw new Error("Invalid endpoint");
  const radians = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * radians;
  const dLon = (b.longitude - a.longitude) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * radians) *
      Math.cos(b.latitude * radians) *
      Math.sin(dLon / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function projectRouteGeometry(
  geometry: unknown,
  transform: ArtworkTransform,
  artwork: { width: number; height: number },
  requestedEndpoints: readonly [Coordinates, Coordinates],
) {
  if (
    !Number.isFinite(artwork.width) ||
    !Number.isFinite(artwork.height) ||
    artwork.width <= 0 ||
    artwork.height <= 0
  )
    throw new Error("Invalid artwork size");
  const coordinates = readRouteLineString(geometry);
  const pixels = coordinates.map((point) => projectToArtwork(point, transform));
  if (pixels.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new Error("Invalid projected route");
  }
  const xs = pixels.map((point) => point.x),
    ys = pixels.map((point) => point.y);
  return {
    pixels,
    // Match the imageOverlay convention already used by map-canvas.tsx.
    leaflet: pixels.map(({ x, y }): [number, number] => [
      artwork.height - y,
      x,
    ]),
    bounds: {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    },
    // Preserve all geometry. The caller must report off-artwork portions, not
    // silently drop vertices and accidentally join disconnected segments.
    outsideVertexCount: pixels.filter(
      ({ x, y }) => x < 0 || y < 0 || x > artwork.width || y > artwork.height,
    ).length,
    endpointGapsMeters: [
      endpointDistanceMeters(requestedEndpoints[0], coordinates[0]),
      endpointDistanceMeters(requestedEndpoints[1], coordinates.at(-1)!),
    ],
  };
}
