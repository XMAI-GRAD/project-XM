import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import type { Metadata } from "next";
import { defaultLocale, hasLocale, locales, type Locale } from "./config";

/** The current page's locale. Unknown locales 404. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

// Preview builds have no NEXT_PUBLIC_SITE_URL; fall back to the deployment URL.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

/** hreflang links for `path` (locale-less, e.g. "/map" or ""). */
export function alternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
    "x-default": `/${defaultLocale}${path}`,
  };
}

/** Per-page metadata: title plus canonical and hreflang links. */
export function pageMetadata(
  lang: Locale,
  path: string,
  title?: string,
): Metadata {
  return {
    ...(title && { title }),
    alternates: { canonical: `/${lang}${path}`, languages: alternates(path) },
  };
}
