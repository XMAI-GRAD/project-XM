import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LangSwitch } from "@/components/lang-switch";
import { AccountStatus, LoginLink } from "@/features/auth/account-status";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, siteUrl } from "@/i18n/server";
import "../globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getDictionary(await getLocale());
  return {
    metadataBase: new URL(siteUrl),
    title: { default: meta.siteName, template: `%s | ${meta.siteName}` },
    description: meta.description,
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const { meta, nav } = getDictionary(lang);
  const other = locales.find((l) => l !== lang)!;

  return (
    <html lang={lang} className={`${hanken.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="pointer-events-none sticky top-0 z-20 flex justify-center px-3 pt-4">
          <nav
            aria-label={nav.label}
            className="pointer-events-auto flex max-w-full items-center gap-3 overflow-x-auto rounded-full bg-surface px-4 py-2.5 text-xs whitespace-nowrap sm:gap-5 sm:px-5 sm:text-[0.8125rem] [&_a:hover]:underline"
          >
            <Link href={`/${lang}`} className="text-dim">
              {meta.siteName}
            </Link>
            <Link href={`/${lang}/map`}>{nav.map}</Link>
            <Link href={`/${lang}/about`}>{nav.about}</Link>
            <ErrorBoundary fallback={<LoginLink lang={lang} />}>
              <Suspense fallback={<LoginLink lang={lang} />}>
                <AccountStatus lang={lang} />
              </Suspense>
            </ErrorBoundary>
            <LangSwitch to={other} label={nav.switchLanguage} />
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
