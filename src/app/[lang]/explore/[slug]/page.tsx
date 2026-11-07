import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { getPoint, points, type Point } from "@/content";
import { getCurrentUser } from "@/features/auth/queries";
import { Comments } from "@/features/interactions/comments";
import { FavoriteButton } from "@/features/interactions/favorite-button";
import { getMyFavoriteSlugs } from "@/features/interactions/queries";
import { StatCounts } from "@/features/interactions/stat-counts";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

// ponytail: the page awaits `params` outside <Suspense>, so client navigations
// block on the server. Fine for prerendered pages. For instant navigation, move
// the `params` read into children inside <Suspense> and drop this (SPEC appendix).
export const instant = false;

export function generateStaticParams() {
  return points.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/explore/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const point = getPoint(slug);
  if (!point) notFound();
  const lang = await getLocale();
  return pageMetadata(lang, `/explore/${slug}`, point.name[lang]);
}

/** Bare point detail: the designed page is built on top of this. */
export default async function PointPage({
  params,
}: PageProps<"/[lang]/explore/[slug]">) {
  const { slug } = await params;
  const point = getPoint(slug);
  if (!point) notFound();
  const lang = await getLocale();
  const { point: t } = getDictionary(lang);
  const cover = point.images[0];

  return (
    <article>
      <p>{point.code.toUpperCase()}</p>
      <h1>{point.name[lang]}</h1>
      <StatCounts lang={lang} slug={slug} favorites />
      <ErrorBoundary fallback={null}>
        <Suspense
          fallback={
            <button type="button" disabled>
              {t.favorite}
            </button>
          }
        >
          <Favorite lang={lang} slug={slug} />
        </Suspense>
      </ErrorBoundary>
      {cover && (
        <Image
          src={cover.src}
          width={cover.width}
          height={cover.height}
          alt={cover.alt[lang]}
          sizes="100vw"
          priority
        />
      )}
      <ul>
        {info(point, lang).map(([label, value], i) => (
          <li key={i}>
            {label && `${label}: `}
            {value}
          </li>
        ))}
      </ul>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t.directions}
      </a>
      {point.audio && (
        <audio controls preload="none" src={point.audio} lang="vi" />
      )}
      <blockquote>{point.hook[lang]}</blockquote>
      {point.story[lang].map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h2>{t.fact}</h2>
      <p>{point.fact[lang]}</p>
      {point.nearby.length > 0 && (
        <>
          <h2>{t.nearby}</h2>
          <ul>
            {point.nearby.map((n) => (
              <li key={n.slug}>
                <Link href={`/${lang}/explore/${n.slug}`}>
                  {getPoint(n.slug)!.name[lang]}
                </Link>{" "}
                ({n.km.toLocaleString(lang)} km)
              </li>
            ))}
          </ul>
        </>
      )}
      <Comments lang={lang} slug={slug} path={`/${lang}/explore/${slug}`} />
    </article>
  );
}

/** Info bar rows, per layer (SPEC Part 2, Points). An empty label shows the value alone. */
function info(point: Point, lang: Locale): [string, string][] {
  const t = getDictionary(lang).point;
  const rows: [string, string][] =
    point.layer === "place"
      ? [
          ["", point.era[lang]],
          ["", point.kind[lang]],
          [t.hours, point.hours[lang]],
          [t.price, point.price[lang]],
        ]
      : point.layer === "taste"
        ? [
            [t.whatToOrder, point.dish[lang]],
            [t.price, point.price[lang]],
            [t.hours, point.hours[lang]],
          ]
        : [
            ["", point.craft[lang]],
            [t.hours, point.hours[lang]],
          ];
  return [...rows, ["", point.address]];
}

async function Favorite({ lang, slug }: { lang: Locale; slug: string }) {
  const { point, errors } = getDictionary(lang);
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${lang}/explore/${slug}`);
    return <Link href={`/${lang}/login?next=${next}`}>{point.favorite}</Link>;
  }
  const favorites = await getMyFavoriteSlugs();
  return (
    <FavoriteButton
      slug={slug}
      initialFavorited={favorites.includes(slug)}
      dict={{ point, errors }}
    />
  );
}
