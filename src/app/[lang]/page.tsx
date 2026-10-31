import type { Metadata } from "next";
import Link from "next/link";
import { heritages } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), "");
}

export default async function HomePage() {
  const lang = await getLocale();
  const { home } = getDictionary(lang);
  return (
    <>
      <h1>{home.title}</h1>
      <p>{home.intro}</p>
      <ul>
        {heritages.map((h) => (
          <li key={h.slug}>
            <Link href={`/${lang}/heritage/${h.slug}`}>{h.name[lang]}</Link>
            <p>{h.summary[lang]}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
