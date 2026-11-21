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
    name: { vi: string; en: string };
    sourceUrl: string;
  };
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
    !design.origin.name?.vi?.trim() ||
    !design.origin.name?.en?.trim() ||
    new URL(design.origin.sourceUrl).protocol !== "https:"
  ) {
    throw new Error("Invalid fixed map origin");
  }
  return design;
}
