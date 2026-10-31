import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/about", getDictionary(lang).about.title);
}

export default async function AboutPage() {
  const { about } = getDictionary(await getLocale());
  return (
    <>
      <h1>{about.title}</h1>
      <p>{about.body}</p>
      <a href={`mailto:${about.contactEmail}`}>{about.contact}</a>
    </>
  );
}
