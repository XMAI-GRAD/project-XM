import {
  validCoordinates,
  type ArtworkPoint,
  type Coordinates,
} from "./georeference.ts";

export interface MapDesign {
  sourceSha256: string;
  coordinateSpace: "designer-artwork";
  artwork: { src: string; width: number; height: number };
  pins: Record<string, ArtworkPoint>;
  origin: Coordinates & {
    position: ArtworkPoint;
    name: { vi: string; en: string };
    sourceUrl: string;
  };
}

/** [x, y] in the current illustration, never longitude/latitude. */
export type IllustratedRoute = [number, number][];

export function readIllustratedRoutes(
  value: unknown,
  design: MapDesign,
): Record<string, IllustratedRoute> {
  const manifest = value as {
    sourceSha256?: string;
    coordinateSpace?: string;
    kind?: string;
    routes?: Record<string, IllustratedRoute>;
  } | null;
  const codes = Object.keys(design.pins);
  if (
    !manifest ||
    manifest.sourceSha256 !== design.sourceSha256 ||
    manifest.coordinateSpace !== "designer-artwork" ||
    manifest.kind !== "illustrated" ||
    !manifest.routes ||
    Object.keys(manifest.routes).length !== codes.length
  ) {
    throw new Error("Invalid illustrated route manifest");
  }
  const atAnchor = (vertex: [number, number], anchor: ArtworkPoint) =>
    Math.hypot(vertex[0] - anchor.x, vertex[1] - anchor.y) < 0.01;
  for (const code of codes) {
    const route = manifest.routes[code];
    if (
      !Array.isArray(route) ||
      route.length < 2 ||
      route.length > 1000 ||
      route.some(
        (vertex) =>
          !Array.isArray(vertex) ||
          vertex.length !== 2 ||
          !vertex.every(Number.isFinite) ||
          vertex[0] < 0 ||
          vertex[0] > design.artwork.width ||
          vertex[1] < 0 ||
          vertex[1] > design.artwork.height,
      ) ||
      !atAnchor(route[0], design.origin.position) ||
      !atAnchor(route[route.length - 1], design.pins[code])
    ) {
      throw new Error(`Invalid illustrated route: ${code}`);
    }
  }
  return manifest.routes;
}

/** Authored display positions must never be mistaken for calibrated coordinates. */
export function readMapDesign(value: unknown, codes: string[]): MapDesign {
  const design = value as MapDesign | null;
  if (
    !design ||
    design.coordinateSpace !== "designer-artwork" ||
    !/^[a-f0-9]{64}$/.test(design.sourceSha256) ||
    !design.artwork ||
    !/^\/maps\/[a-z0-9/.-]+\.svg$/.test(design.artwork.src) ||
    !Number.isFinite(design.artwork.width) ||
    design.artwork.width <= 0 ||
    !Number.isFinite(design.artwork.height) ||
    design.artwork.height <= 0 ||
    !design.pins ||
    Object.keys(design.pins).length !== codes.length
  ) {
    throw new Error("Invalid map design manifest");
  }
  for (const code of codes) {
    const p = design.pins[code];
    if (
      !p ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      p.x < 0 ||
      p.y < 0 ||
      p.x > design.artwork.width ||
      p.y > design.artwork.height
    ) {
      throw new Error(`Missing or invalid authored pin: ${code}`);
    }
  }
  if (
    !design.origin ||
    !validCoordinates(design.origin) ||
    !design.origin.position ||
    !Number.isFinite(design.origin.position.x) ||
    !Number.isFinite(design.origin.position.y) ||
    design.origin.position.x < 0 ||
    design.origin.position.y < 0 ||
    design.origin.position.x > design.artwork.width ||
    design.origin.position.y > design.artwork.height ||
    !design.origin.name?.vi?.trim() ||
    !design.origin.name?.en?.trim() ||
    new URL(design.origin.sourceUrl).protocol !== "https:"
  ) {
    throw new Error("Invalid fixed map origin");
  }
  return design;
}
