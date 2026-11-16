import {
  projectToArtwork,
  type ArtworkPoint,
  type ArtworkTransform,
  type Coordinates,
} from "./georeference.ts";
import { projectRouteGeometry } from "./route-geometry.ts";

export interface SavedMapRoute {
  id: string;
  from: string;
  to: string;
  pixels: ArtworkPoint[];
  distanceMeters: number;
  durationSeconds: number;
  savedOn: string;
  reviewedOn: string;
  sourceUrl: string;
  endpointGapsMeters: number[];
}
export interface MapContextLabel {
  id: string;
  kind: "road" | "landmark";
  name: { vi: string; en: string };
  priority: number;
  anchors: { position: ArtworkPoint; angle: number }[];
}
type Endpoint = { slug: string; mapLocation?: Coordinates };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected map data object");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Expected nonempty map data text");
  return value;
}
function positive(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    throw new Error("Invalid map data number");
  return value;
}
function date(value: unknown): string {
  const result = text(value);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    new Date(result).toISOString().slice(0, 10) !== result
  )
    throw new Error("Invalid route date");
  return result;
}
function https(value: unknown): string {
  const url = new URL(text(value));
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Invalid map source URL");
  return url.href;
}
function coordinate(value: unknown): Coordinates {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((v) => typeof v !== "number" || !Number.isFinite(v))
  )
    throw new Error("Invalid context coordinate");
  return { longitude: value[0], latitude: value[1] };
}
export function readSavedRoutes(
  value: unknown,
  points: Endpoint[],
  transform: ArtworkTransform,
  artwork: { width: number; height: number },
): SavedMapRoute[] {
  const root = object(value);
  if (
    root.version !== 1 ||
    !Array.isArray(root.routes) ||
    root.routes.length > 132
  )
    throw new Error("Invalid saved route catalogue");
  const ids = new Set<string>(),
    pairs = new Set<string>();
  return root.routes.map((value) => {
    const r = object(value),
      id = text(r.id),
      from = text(r.from),
      to = text(r.to);
    if (from === to || ids.has(id) || pairs.has(`${from}/${to}`))
      throw new Error("Duplicate or same-place saved route");
    ids.add(id);
    pairs.add(`${from}/${to}`);
    if (
      r.mode !== "walking" ||
      r.review !== "geometry-checked" ||
      r.provider !== "FOSSGIS OSRM" ||
      !/^[a-f0-9]{64}$/.test(text(r.sourceSha256))
    )
      throw new Error("Missing saved route provenance");
    if (!Array.isArray(r.endpoints) || r.endpoints.length !== 2)
      throw new Error("Invalid saved route endpoints");
    const endpoints = [from, to].map((slug, i) => {
      const canonical = points.find((p) => p.slug === slug)?.mapLocation;
      const saved = object((r.endpoints as unknown[])[i]);
      if (
        !canonical ||
        canonical.latitude !== saved.latitude ||
        canonical.longitude !== saved.longitude
      )
        throw new Error(`Stale or unknown route endpoint: ${slug}`);
      return canonical;
    }) as [Coordinates, Coordinates];
    const projection = projectRouteGeometry(
      r.geometry,
      transform,
      artwork,
      endpoints,
    );
    if (
      projection.outsideVertexCount ||
      projection.endpointGapsMeters.some((gap) => gap > 30)
    )
      throw new Error("Route exceeds artwork or endpoint-gap review limits");
    const savedOn = date(r.savedOn),
      reviewedOn = date(r.reviewedOn);
    if (reviewedOn < savedOn) throw new Error("Route review predates source");
    return {
      id,
      from,
      to,
      pixels: projection.pixels,
      endpointGapsMeters: projection.endpointGapsMeters,
      distanceMeters: positive(r.distanceMeters),
      durationSeconds: positive(r.durationSeconds),
      savedOn,
      reviewedOn,
      sourceUrl: https(r.sourceUrl),
    };
  });
}
export function readMapContext(
  value: unknown,
  transform: ArtworkTransform,
  artwork: { width: number; height: number },
): MapContextLabel[] {
  const root = object(value);
  https(root.sourceUrl);
  text(root.snapshot);
  if (
    root.version !== 1 ||
    !Array.isArray(root.labels) ||
    root.labels.length > 200
  )
    throw new Error("Invalid geographic labels");
  const ids = new Set<string>();
  return root.labels.map((value) => {
    const item = object(value),
      id = text(item.id),
      name = object(item.name);
    if (ids.has(id) || !["road", "landmark"].includes(text(item.kind)))
      throw new Error("Invalid or duplicate geographic label");
    ids.add(id);
    if (
      !Array.isArray(item.anchors) ||
      !item.anchors.length ||
      item.anchors.length > 10 ||
      !Array.isArray(item.sourceRefs) ||
      !item.sourceRefs.length
    )
      throw new Error("Geographic label needs anchors and provenance");
    for (const value of item.sourceRefs) {
      const ref = object(value);
      if (
        !/^\d+-\d+-\d+$/.test(text(ref.tile)) ||
        !["transportation_name", "poi"].includes(text(ref.layer)) ||
        !Number.isSafeInteger(ref.index) ||
        Number(ref.index) < 0
      )
        throw new Error("Invalid vector-tile reference");
    }
    if (
      typeof item.priority !== "number" ||
      !Number.isSafeInteger(item.priority) ||
      item.priority < 0
    )
      throw new Error("Invalid label priority");
    const anchors = item.anchors.map((value) => {
      const anchor = object(value),
        position = projectToArtwork(coordinate(anchor.coordinates), transform);
      if (
        position.x < 0 ||
        position.y < 0 ||
        position.x > artwork.width ||
        position.y > artwork.height
      )
        throw new Error("Context label outside artwork");
      let angle = 0;
      if (item.kind === "road") {
        if (!Array.isArray(anchor.tangent) || anchor.tangent.length !== 2)
          throw new Error("Road label needs source tangent");
        const [a, b] = anchor.tangent.map((v) =>
          projectToArtwork(coordinate(v), transform),
        );
        angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;
      }
      return { position, angle };
    });
    return {
      id,
      kind: item.kind as MapContextLabel["kind"],
      name: { vi: text(name.vi), en: text(name.en) },
      priority: item.priority,
      anchors,
    };
  });
}
/** Direction matters: no implicit reverse path and no stale result for missing pairs. */
export function findSavedRoute(
  routes: SavedMapRoute[],
  from: string,
  to: string,
) {
  if (!from || !to || from === to) return undefined;
  return routes.find((route) => route.from === from && route.to === to);
}
