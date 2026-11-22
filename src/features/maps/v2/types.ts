import type { Layer } from "@/content";
import type { ReactNode } from "react";
import type { IllustratedRoute } from "../design";

export interface DesignMapOrigin {
  name: string;
  position: { x: number; y: number };
}

export interface DesignMapPoint {
  slug: string;
  code: string;
  layer: Layer;
  name: string;
  address: string;
  hook: string;
  headline: ReactNode[];
  photo: { src: string; width: number; height: number; alt: string } | null;
  position: { x: number; y: number };
  route: IllustratedRoute;
}

export interface DesignMapGroup {
  layer: Layer;
  name: string;
  intro: string;
  points: DesignMapPoint[];
}
