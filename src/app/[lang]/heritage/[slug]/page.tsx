import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeritage, heritages } from "@/content";
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
    </article>
  );
}
