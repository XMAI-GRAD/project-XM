import { notFound, permanentRedirect } from "next/navigation";
import { getPoint, points } from "@/content";
import { pointHref } from "@/features/explore/paths";
import { getLocale } from "@/i18n/server";

export const instant = false;

export function generateStaticParams() {
  return points.map((p) => ({ slug: p.slug }));
}

/**
 * Points used to live at /explore/<slug>; they now sit under their layer. Old links
 * (shared, bookmarked, the old sitemap) move to the new address.
 */
export default async function OldPointPath({
  params,
}: PageProps<"/[lang]/explore/[slug]">) {
  const point = getPoint((await params).slug);
  if (!point) notFound();
  permanentRedirect(pointHref(await getLocale(), point));
}
