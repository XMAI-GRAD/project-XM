import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export default async function NotFound() {
  const lang = await getLocale();
  const { notFound } = getDictionary(lang);
  return (
    <>
      <h1>{notFound.title}</h1>
      <p>{notFound.body}</p>
      <Link href={`/${lang}`}>{notFound.backHome}</Link>
    </>
  );
}
