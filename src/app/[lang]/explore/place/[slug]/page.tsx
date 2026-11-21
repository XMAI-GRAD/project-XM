import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPoint, getPoints } from "@/content";
import { PointPage, pointMetadata } from "@/features/explore/place/point-page";
import { getLocale } from "@/i18n/server";

// ponytail: the page awaits `params` outside <Suspense>, so client navigations
// block on the server. Fine for prerendered pages. For instant navigation, move
// the `params` read into children inside <Suspense> and drop this (SPEC appendix).
export const instant = false;

export function generateStaticParams() {
  return getPoints("place").map((p) => ({ slug: p.slug }));
}

/** The point named in the URL, if it is one of this layer's. */
function pointOf(slug: string) {
  const point = getPoint(slug);
  return point?.layer === "place" ? point : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/explore/place/[slug]">): Promise<Metadata> {
  const point = pointOf((await params).slug);
  if (!point) notFound();
  return pointMetadata(point, await getLocale());
}

/**
 * A ĐỊA point's page (the ĐỊA comps, pages 2–6).
 */
export default async function PlacePointPage({
  params,
}: PageProps<"/[lang]/explore/place/[slug]">) {
  const point = pointOf((await params).slug);
  if (!point) notFound();
  return <PointPage point={point} lang={await getLocale()} />;
}
