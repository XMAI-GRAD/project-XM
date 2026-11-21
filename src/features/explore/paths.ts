import type { Layer } from "@/content";

/** A point's page, under its layer's explore page: `/explore/place/van-mieu…`. */
export function pointPath(point: { layer: Layer; slug: string }) {
  return `/explore/${point.layer}/${point.slug}`;
}

/** The same, in a language: what links use. */
export function pointHref(lang: string, point: { layer: Layer; slug: string }) {
  return `/${lang}${pointPath(point)}`;
}
