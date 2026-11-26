import en from "./dictionaries/en.json";
import vi from "./dictionaries/vi.json";
import type { Locale } from "./config";

export type Dictionary = typeof vi;

const dictionaries: Record<Locale, Dictionary> = { vi, en };

// The type above catches keys missing from en; this also catches extra ones, at build.
const keys = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
if (keys(vi).sort().join() !== keys(en).sort().join())
  throw new Error("vi.json and en.json must have the same keys");

export const getDictionary = (lang: Locale) => dictionaries[lang];
