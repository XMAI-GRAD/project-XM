import type { Metadata } from "next";
import Link from "next/link";
import { getHeritage, route } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/map", getDictionary(lang).map.title);
}

// Placeholder: pins in route order. The illustrated map comes with the design.
export default async function MapPage() {
  const lang = await getLocale();
  const { map } = getDictionary(lang);
  return (
    <>
      <h1>{map.title}</h1>
      <ol>
        {route.map((slug) => (
          <li key={slug}>
            <Link href={`/${lang}/heritage/${slug}`}>
              {getHeritage(slug)!.name[lang]}
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
