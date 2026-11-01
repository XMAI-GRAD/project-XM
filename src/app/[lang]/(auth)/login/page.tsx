import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { heritages } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import { signInWithGoogle } from "@/features/auth/actions";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/login", getDictionary(lang).login.title);
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/[lang]/login">) {
  const lang = await getLocale();
  const { login } = getDictionary(lang);
  const site = heritages[0];

  return (
    <div className={s.page}>
      <div className={s.frame} aria-hidden="true">
        <Image
          src={site.images[0].src}
          alt=""
          fill
          sizes="(max-width: 800px) 100vw, 45vw"
          priority
          className={s.photo}
        />
        <div className={s.caption}>
          <p>{site.name[lang]}</p>
          <p className={s.captionSummary}>{site.summary[lang]}</p>
        </div>
      </div>

      <section className={s.panel}>
        <h1 className={s.title}>{login.title}</h1>
        <p className={s.lead}>{login.lead}</p>
        <Suspense fallback={<GoogleButton label={login.continueWithGoogle} />}>
          <LoginForm lang={lang} searchParams={searchParams} />
        </Suspense>
        <p className={s.note}>{login.note}</p>
        <Link href={`/${lang}`} className={s.back}>
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d="M14 8H3M7 4 3 8l4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          {login.back}
        </Link>
      </section>
    </div>
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
      {error && (
        <p role="alert" className={s.error}>
          {login.error}
        </p>
      )}
      <GoogleButton label={login.continueWithGoogle} submit />
    </form>
  );
}

/** Disabled until the form streams in. */
function GoogleButton({ label, submit }: { label: string; submit?: boolean }) {
  return (
    <button
      type={submit ? "submit" : "button"}
      disabled={!submit}
      className={s.google}
    >
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      {label}
    </button>
  );
}
