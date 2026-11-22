import type { Layer } from "@/content";
import type { ReactNode } from "react";

export interface DesignMapPoint {
  slug: string;
  code: string;
  layer: Layer;
  name: string;
  address: string;
  hook: string;
  headline: ReactNode[];
  photo: { src: string; width: number; height: number; alt: string } | null;
  directionsDestination: string;
  position: { x: number; y: number };
}

export interface DesignMapGroup {
  layer: Layer;
  name: string;
  intro: string;
  points: DesignMapPoint[];
}
