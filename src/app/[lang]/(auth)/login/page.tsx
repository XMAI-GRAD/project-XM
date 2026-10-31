import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import { signInWithGoogle } from "@/features/auth/actions";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/login", getDictionary(lang).login.title);
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/[lang]/login">) {
  const lang = await getLocale();
  const { login } = getDictionary(lang);
  return (
    <>
      <h1>{login.title}</h1>
      <Suspense
        fallback={
          <button type="button" disabled>
            {login.continueWithGoogle}
          </button>
        }
      >
        <LoginForm lang={lang} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LoginForm({
  lang,
  searchParams,
}: {
  lang: Locale;
  searchParams: PageProps<"/[lang]/login">["searchParams"];
}) {
  const { next, error } = await searchParams;
  const { login } = getDictionary(lang);
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="lang" value={lang} />
      <input
        type="hidden"
        name="next"
        value={typeof next === "string" ? next : ""}
      />
      {error && <p role="alert">{login.error}</p>}
      <button type="submit">{login.continueWithGoogle}</button>
    </form>
  );
}
