import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle, getHeritage } from "@/content";
import { getLocale, pageMetadata } from "@/i18n/server";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const lang = await getLocale();
  return pageMetadata(lang, `/articles/${slug}`, article.title[lang]);
}

export default async function ArticlePage({
  params,
}: PageProps<"/[lang]/articles/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const lang = await getLocale();
  const heritage = getHeritage(article.heritageSlug)!;

  return (
    <article>
      <h1>{article.title[lang]}</h1>
      <time dateTime={article.publishedAt}>{article.publishedAt}</time>
      <Image
        src={article.cover.src}
        width={article.cover.width}
        height={article.cover.height}
        alt={article.cover.alt[lang]}
        sizes="100vw"
      />
      {article.body[lang].map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <Link href={`/${lang}/heritage/${heritage.slug}`}>
        {heritage.name[lang]}
      </Link>
    </article>
  );
}
