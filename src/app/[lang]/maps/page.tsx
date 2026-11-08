import type { Metadata } from "next";
import { getPage, getPoints, layers } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import { MapExplorer, type MapGroup } from "./map-explorer";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/maps", getPage("maps").title[lang]);
}

export default async function MapsPage() {
  const lang = await getLocale();
  const maps = getPage("maps");
  const site = getPage("site");
  const { maps: ui, layers: layerNames, nav, explore } = getDictionary(lang);
  const groups: MapGroup[] = layers.map((layer) => ({
    layer,
    name: layerNames[layer],
    intro: maps.layers[layer][lang],
    points: getPoints(layer).map((point) => {
      const image = point.images[0];
      return {
        slug: point.slug,
        code: point.code,
        name: point.name[lang],
        address: point.address,
        hook: point.hook[lang],
        cover: image ? { ...image, alt: image.alt[lang] } : undefined,
      };
    }),
  }));

  return (
    <div className={s.page}>
      <header className={s.heading}>
        <div>
          <p className={`meta ${s.eyebrow}`}>
            <span className={s.connectionMark} aria-hidden="true">
              {layers.map((layer) => (
                <i key={layer} data-layer={layer} />
              ))}
            </span>
            {nav.maps}
          </p>
          <h1>{maps.title[lang]}</h1>
        </div>
        <p className={s.lead}>{maps.lead[lang]}</p>
      </header>
      <MapExplorer
        lang={lang}
        groups={groups}
        artwork={{ ...maps.artwork, alt: maps.artwork.alt[lang] }}
        brand={site.brand[lang]}
        ui={ui}
        emptyLabel={explore.empty}
      />
    </div>
  );
}
