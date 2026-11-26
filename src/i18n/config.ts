export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export const localeCookie = "NEXT_LOCALE";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** The same page in another language: `/vi/map` → `/en/map`. */
export function localizePath(pathname: string, lang: Locale) {
  return pathname.replace(/^\/[^/]*/, `/${lang}`);
}
