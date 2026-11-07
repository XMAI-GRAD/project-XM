import type { Metadata } from "next";
import Link from "next/link";
import { getPage, getPoints, layers } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/explore", getPage("explore").title[lang]);
}

// Bare list per layer: the designed tabs and list view are built on top of this.
export default async function ExplorePage() {
  const lang = await getLocale();
  const explore = getPage("explore");
  const { layers: layerNames, explore: t } = getDictionary(lang);
  return (
    <>
      <h1>{explore.title[lang]}</h1>
      <p>{explore.lead[lang]}</p>
      {layers.map((layer) => {
        const points = getPoints(layer);
        return (
          <section key={layer}>
            <h2>{layerNames[layer]}</h2>
            {points.length > 0 ? (
              <ul>
                {points.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/${lang}/explore/${p.slug}`}>
                      {p.code.toUpperCase()} · {p.name[lang]}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t.empty}</p>
            )}
          </section>
        );
      })}
    </>
  );
}
