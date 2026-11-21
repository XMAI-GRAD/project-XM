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
  return getPoints("taste").map((p) => ({ slug: p.slug }));
}

/** The point named in the URL, if it is one of this layer's. */
function pointOf(slug: string) {
  const point = getPoint(slug);
  return point?.layer === "taste" ? point : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/explore/taste/[slug]">): Promise<Metadata> {
  const point = pointOf((await params).slug);
  if (!point) notFound();
  return pointMetadata(point, await getLocale());
}

/**
 * A VỊ point's page. Its comp hasn't arrived: until it does, it borrows the ĐỊA
 * point page. It is a route of its own, to be designed on its own.
 */
export default async function TastePointPage({
  params,
}: PageProps<"/[lang]/explore/taste/[slug]">) {
  const point = pointOf((await params).slug);
  if (!point) notFound();
  return <PointPage point={point} lang={await getLocale()} />;
}
