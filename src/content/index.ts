import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export type Localized<T = string> = { vi: T; en: T };

export const layers = ["place", "taste", "craft"] as const;
export type Layer = (typeof layers)[number];
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: Localized;
}

interface PointBase {
  slug: string;
  code: string;
  name: Localized;
  hook: Localized;
  story: Localized<string[]>;
  fact: Localized;
  address: string;
  hours: Localized;
  nearby: { slug: string; km: number }[];
  images: Photo[];
  audio?: string;
}

export interface Place extends PointBase {
  layer: "place";
  era: Localized;
  kind: Localized;
  price: Localized;
}
export interface Taste extends PointBase {
  layer: "taste";
  since?: number;
  dish: Localized;
  price: Localized;
  season: Season;
}
export interface Craft extends PointBase {
  layer: "craft";
  craft: Localized;
}
export type Point = Place | Taste | Craft;

export interface EventCard {
  title: Localized;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  place: Localized;
  image?: Photo; // absent until the event has a photo
}

export interface Pages {
  site: {
    brand: Localized;
    designation: Localized;
    fullName: Localized;
    tagline: Localized;
    motto: Localized;
    mottoShort: Localized;
    contact: {
      address: Localized<string[]>;
      hours: Localized<string[]>;
      phone: string;
      email: string;
    };
    credits: Localized;
  };
  home: {
    lead: Localized;
    intro: { title: Localized; body: Localized<string[]> };
  };
  explore: { title: Localized; lead: Localized };
  maps: { title: Localized; lead: Localized; layers: Record<Layer, Localized> };
}

// Bundled as text (next.config.ts rule), so `next dev` reloads content when a YAML file
// changes; files read with fs at runtime are not watched. Read `.default` per module:
// the glob's `import: "default"` option yields undefined in `next build` (Next 16.4).
const files = import.meta.glob<{ default: string }>("/data/**/*.yaml", {
  query: "?raw",
  eager: true,
});
const read = (file: string): unknown => {
  const text = files[`/data/${file}`]?.default;
  if (text === undefined) throw new Error(`data/${file} is missing`);
  return parse(text);
};

const codePrefix: Record<Layer, string> = {
  place: "d",
  taste: "v",
  craft: "n",
};

export const points: Point[] = layers.flatMap((layer) =>
  (read(`points/${layer}.yaml`) as Omit<Point, "layer">[]).map(
    (p) => ({ ...p, layer }) as Point,
  ),
);
const events = (read("events.yaml") ?? []) as EventCard[];
const pages = Object.fromEntries(
  (["site", "home", "explore", "maps"] as const).map((name) => [
    name,
    read(`${name}.yaml`),
  ]),
) as unknown as Pages;

const isEmpty = (v: unknown) => {
  const parts = Array.isArray(v) ? v : [v];
  return (
    parts.length === 0 || parts.some((p) => typeof p !== "string" || !p.trim())
  );
};

// public/ isn't shipped with the deployed functions (next.config.ts), so file checks and warnings run in dev and `next build` only.
const buildOrDev =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PHASE === "phase-production-build";

// Runs when the module loads, so a bad YAML edit fails `next build`.
function validate(): string[] {
  const errors: string[] = [];
  const untranslated: string[] = [];
  const walk = (where: string, value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if ("vi" in value || "en" in value) {
      const text = value as Localized<unknown>;
      if (isEmpty(text.vi)) errors.push(`${where}: empty "vi"`);
      // ponytail: English is translated later; until then an empty `en` shows the Vietnamese.
      else if (isEmpty(text.en)) {
        untranslated.push(where);
        text.en = text.vi;
      }
      return;
    }
    for (const [k, v] of Object.entries(value)) walk(`${where}.${k}`, v);
  };
  const checkFile = (where: string, src: string) => {
    if (buildOrDev && !existsSync(join(process.cwd(), "public", src)))
      errors.push(`${where}: missing file public${src}`);
  };

  for (const [name, page] of Object.entries(pages)) walk(name, page);

  const slugs = new Set<string>();
  const codes = new Set<string>();
  for (const p of points) {
    if (slugs.has(p.slug)) errors.push(`duplicate slug "${p.slug}"`);
    if (codes.has(p.code)) errors.push(`duplicate code "${p.code}"`);
    slugs.add(p.slug);
    codes.add(p.code);
    if (!p.code?.startsWith(codePrefix[p.layer]))
      errors.push(`${p.slug}: code "${p.code}" doesn't match ${p.layer}`);
    walk(p.slug, p);
    p.images.forEach((img, i) => checkFile(`${p.slug} images[${i}]`, img.src));
    if (p.audio) checkFile(`${p.slug} audio`, p.audio);
  }
  for (const p of points)
    for (const n of p.nearby)
      if (!slugs.has(n.slug))
        errors.push(`${p.slug}: nearby "${n.slug}" is not a point`);
  // Round-trips, so 2026-02-31 fails instead of rolling over to March.
  const isDate = (d: unknown) =>
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    new Date(Date.parse(d) || 0).toISOString().slice(0, 10) === d;
  events.forEach((e, i) => {
    const where = `events[${i}]`;
    if (!isDate(e.date)) errors.push(`${where}: date must be YYYY-MM-DD`);
    if (e.endDate !== undefined && !(isDate(e.endDate) && e.endDate >= e.date))
      errors.push(`${where}: endDate must be YYYY-MM-DD, not before date`);
    walk(where, e);
    if (e.image) checkFile(`${where} image`, e.image.src);
  });
  if (untranslated.length && buildOrDev)
    console.warn(
      `data/: ${untranslated.length} fields have no English yet; showing Vietnamese.`,
    );
  return errors;
}

const errors = validate();
if (errors.length)
  throw new Error(`data/ content is invalid:\n- ${errors.join("\n- ")}`);

/** Every point slug. Validates user-supplied slugs (favorites, comments). */
export const pointSlugs: ReadonlySet<string> = new Set(
  points.map((p) => p.slug),
);

export const getPoints = (layer: Layer) =>
  points.filter((p) => p.layer === layer);
export const getPoint = (slug: string) => points.find((p) => p.slug === slug);
/** Events sorted by date, earliest first. */
export const getEvents = (): EventCard[] =>
  [...events].sort((a, b) => a.date.localeCompare(b.date));
export const getPage = <K extends keyof Pages>(name: K): Pages[K] =>
  pages[name];
