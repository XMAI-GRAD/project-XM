import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import raw from "../../data/heritages.json";
import { locales } from "@/i18n/config";

export type Localized<T = string> = { vi: T; en: T };

export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: Localized;
}

export interface Article {
  slug: string;
  title: Localized;
  excerpt: Localized;
  cover: Photo;
  body: Localized<string[]>;
  publishedAt: string;
}

export interface Heritage {
  slug: string;
  name: Localized;
  summary: Localized;
  body: Localized<string[]>;
  images: Photo[];
  map: { x: number; y: number };
  articles: Article[];
}

export interface HeritageData {
  route: string[];
  heritages: Heritage[];
}

const data: HeritageData = raw;

// Runs when the module loads, so a bad edit to heritages.json fails `next build`.
function validate({ route, heritages }: HeritageData): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const checkSlug = (slug: string) => {
    if (seen.has(slug)) errors.push(`duplicate slug "${slug}"`);
    seen.add(slug);
  };
  const checkText = (where: string, value: Localized<string | string[]>) => {
    for (const lang of locales) {
      const v = value[lang];
      const parts = Array.isArray(v) ? v : [v];
      if (parts.length === 0 || parts.some((p) => !p?.trim()))
        errors.push(`${where}: empty "${lang}"`);
    }
  };
  const checkPhoto = (where: string, photo: Photo) => {
    checkText(`${where} alt`, photo.alt);
    if (!existsSync(join(process.cwd(), "public", photo.src)))
      errors.push(`${where}: missing image public${photo.src}`);
  };

  for (const h of heritages) {
    checkSlug(h.slug);
    checkText(`${h.slug} name`, h.name);
    checkText(`${h.slug} summary`, h.summary);
    checkText(`${h.slug} body`, h.body);
    h.images.forEach((p, i) => checkPhoto(`${h.slug} images[${i}]`, p));
    for (const a of h.articles) {
      checkSlug(a.slug);
      checkText(`${a.slug} title`, a.title);
      checkText(`${a.slug} excerpt`, a.excerpt);
      checkText(`${a.slug} body`, a.body);
      checkPhoto(`${a.slug} cover`, a.cover);
    }
  }
  const heritageSlugs = new Set(heritages.map((h) => h.slug));
  for (const stop of route)
    if (!heritageSlugs.has(stop))
      errors.push(`route stop "${stop}" is not a heritage`);
  return errors;
}

const errors = validate(data);
if (errors.length)
  throw new Error(`data/heritages.json is invalid:\n- ${errors.join("\n- ")}`);

export const { route, heritages } = data;
export const articles = heritages.flatMap((h) =>
  h.articles.map((a) => ({ ...a, heritageSlug: h.slug })),
);

export const heritageSlugs: ReadonlySet<string> = new Set(
  heritages.map((h) => h.slug),
);
export const articleSlugs: ReadonlySet<string> = new Set(
  articles.map((a) => a.slug),
);
/** Valid comment targets: every heritage and article slug. */
export const contentSlugs: ReadonlySet<string> = new Set([
  ...heritageSlugs,
  ...articleSlugs,
]);

export const getHeritage = (slug: string) =>
  heritages.find((h) => h.slug === slug);
export const getArticle = (slug: string) =>
  articles.find((a) => a.slug === slug);
