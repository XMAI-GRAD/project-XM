import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/login", getDictionary(lang).login.title);
}

// The Google sign-in action lands in #4.
export default async function LoginPage() {
  const { login } = getDictionary(await getLocale());
  return (
    <>
      <h1>{login.title}</h1>
      <button type="button" disabled>
        {login.continueWithGoogle}
      </button>
    </>
  );
}
