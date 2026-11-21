import type { Layer } from "@/content";

export interface DesignMapPoint {
  slug: string;
  code: string;
  layer: Layer;
  name: string;
  address: string;
  hook: string;
  position: { x: number; y: number };
}

export interface DesignMapGroup {
  layer: Layer;
  name: string;
  intro: string;
  points: DesignMapPoint[];
}
