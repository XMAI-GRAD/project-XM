import type { Metadata } from "next";
import { Inter, Phudu } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, siteUrl } from "@/i18n/server";
import "../globals.css";

const display = Phudu({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});
const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  display: "swap",
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

/**
 * The document only. Home draws its own frame (src/features/home); every other page
 * sits in the rail-and-top-bar frame of (site)/layout.tsx.
 */
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
