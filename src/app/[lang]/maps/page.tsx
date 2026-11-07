import type { Metadata } from "next";
import Link from "next/link";
import { getPage, getPoints, layers } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/maps", getPage("maps").title[lang]);
}

// Placeholder: points per layer. The map itself is free-form (SPEC Part 3, Map).
export default async function MapsPage() {
  const lang = await getLocale();
  const maps = getPage("maps");
  const { layers: layerNames } = getDictionary(lang);
  return (
    <>
      <h1>{maps.title[lang]}</h1>
      <p>{maps.lead[lang]}</p>
      {layers.map((layer) => (
        <section key={layer}>
          <h2>
            {layerNames[layer]} · {maps.layers[layer][lang]}
          </h2>
          <ul>
            {getPoints(layer).map((p) => (
              <li key={p.slug}>
                <Link href={`/${lang}/explore/${p.slug}`}>{p.name[lang]}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
