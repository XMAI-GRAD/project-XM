import type { Metadata } from "next";
import { getPage, getPoints, layers } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import { ExploreTabs } from "./explore-tabs";
import s from "./page.module.css";
import { PointRow } from "./point-row";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/explore", getPage("explore").title[lang]);
}

export default async function ExplorePage() {
  const lang = await getLocale();
  const explore = getPage("explore");
  const { layers: layerNames, explore: t } = getDictionary(lang);

  const tabs = layers.map((layer) => {
    const points = getPoints(layer);
    return {
      layer,
      name: layerNames[layer],
      content:
        points.length > 0 ? (
          <ol className={s.list}>
            {points.map((p) => (
              <PointRow key={p.slug} point={p} lang={lang} />
            ))}
          </ol>
        ) : (
          <p className={s.empty}>{t.empty}</p>
        ),
    };
  });

  return (
    <div className={s.page}>
      <header className={s.head}>
        <h1 className={s.title}>{explore.title[lang]}</h1>
        <p className={s.lead}>{explore.lead[lang]}</p>
      </header>
      <ExploreTabs tabs={tabs} label={t.tabsLabel} />
    </div>
  );
}
