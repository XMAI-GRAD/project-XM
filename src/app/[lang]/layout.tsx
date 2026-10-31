import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LangSwitch } from "@/components/lang-switch";
import { AccountStatus, LoginLink } from "@/features/auth/account-status";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, siteUrl } from "@/i18n/server";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  const { nav } = getDictionary(lang);
  const other = locales.find((l) => l !== lang)!;

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header>
          <nav>
            <Link href={`/${lang}`}>{nav.home}</Link>{" "}
            <Link href={`/${lang}/map`}>{nav.map}</Link>{" "}
            <Link href={`/${lang}/about`}>{nav.about}</Link>{" "}
            <ErrorBoundary fallback={<LoginLink lang={lang} />}>
              <Suspense fallback={<LoginLink lang={lang} />}>
                <AccountStatus lang={lang} />
              </Suspense>
            </ErrorBoundary>{" "}
            <LangSwitch to={other} label={nav.switchLanguage} />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
