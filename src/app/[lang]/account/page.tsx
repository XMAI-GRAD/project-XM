import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return {
    title: getDictionary(lang).account.title,
    robots: { index: false },
  };
}

// Login gate and profile land in #4.
export default async function AccountPage() {
  const { account } = getDictionary(await getLocale());
  return <h1>{account.title}</h1>;
}
