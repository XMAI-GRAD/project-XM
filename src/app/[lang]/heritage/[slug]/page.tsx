import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { getHeritage, heritages } from "@/content";
import { getCurrentUser } from "@/features/auth/queries";
import { Comments } from "@/features/interactions/comments";
import { FavoriteButton } from "@/features/interactions/favorite-button";
import { getMyFavoriteSlugs } from "@/features/interactions/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export function generateStaticParams() {
  return heritages.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/heritage/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const heritage = getHeritage(slug);
  if (!heritage) notFound();
  const lang = await getLocale();
  return pageMetadata(lang, `/heritage/${slug}`, heritage.name[lang]);
}

export default async function HeritagePage({
  params,
}: PageProps<"/[lang]/heritage/[slug]">) {
  const { slug } = await params;
  const heritage = getHeritage(slug);
  if (!heritage) notFound();
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <article>
      <h1>{heritage.name[lang]}</h1>
      <p>{heritage.summary[lang]}</p>
      <ErrorBoundary fallback={null}>
        <Suspense
          fallback={
            <button type="button" disabled>
              {dict.heritage.favorite}
            </button>
          }
        >
          <Favorite lang={lang} slug={slug} />
        </Suspense>
      </ErrorBoundary>
      {heritage.images.map((img) => (
        <Image
          key={img.src}
          src={img.src}
          width={img.width}
          height={img.height}
          alt={img.alt[lang]}
          sizes="100vw"
        />
      ))}
      {heritage.body[lang].map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {heritage.articles.length > 0 && (
        <section>
          <h2>{dict.heritage.relatedArticles}</h2>
          <ul>
            {heritage.articles.map((a) => (
              <li key={a.slug}>
                <Link href={`/${lang}/articles/${a.slug}`}>
                  {a.title[lang]}
                </Link>
                <p>{a.excerpt[lang]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Comments lang={lang} slug={slug} path={`/${lang}/heritage/${slug}`} />
    </article>
  );
}

async function Favorite({ lang, slug }: { lang: Locale; slug: string }) {
  const { heritage, errors } = getDictionary(lang);
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${lang}/heritage/${slug}`);
    return (
      <Link href={`/${lang}/login?next=${next}`}>{heritage.favorite}</Link>
    );
  }
  const favorites = await getMyFavoriteSlugs();
  return (
    <FavoriteButton
      slug={slug}
      initialFavorited={favorites.includes(slug)}
      dict={{ heritage, errors }}
    />
  );
}
