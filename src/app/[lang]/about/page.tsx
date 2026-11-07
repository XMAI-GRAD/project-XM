import type { Metadata } from "next";
import { getPage } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/about", getDictionary(lang).about.title);
}

// Placeholder: the About page (SPEC Part 1, Screens) is built on top of this.
export default async function AboutPage() {
  const lang = await getLocale();
  const { about } = getDictionary(lang);
  const site = getPage("site");
  return (
    <>
      <h1>{about.title}</h1>
      <p>{site.fullName[lang]}</p>
    </>
  );
}
