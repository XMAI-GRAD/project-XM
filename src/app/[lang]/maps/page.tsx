import type { CSSProperties } from "react";
import type { Metadata } from "next";
import {
  getPage,
  getPoints,
  illustratedMapRoutes,
  layers,
  mapDesign,
} from "@/content";
import { SiteFooter } from "@/components/site-footer";
import { HomeHeader } from "@/features/home/home-header";
import { RichText } from "@/features/home/rich-text";
import h from "@/features/home/home.module.css";
import { DesignMapExplorer } from "@/features/maps/v2/explorer";
import { MapPageMotion } from "@/features/maps/v2/page-motion";
import s from "@/features/maps/v2/map.module.css";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/maps", getPage("maps").title[lang]);
}

export default async function MapsPage() {
  const lang = await getLocale();
  const maps = getPage("maps");
  const { maps: ui, layers: names } = getDictionary(lang);
  const groups = layers.map((layer) => ({
    layer,
    name: names[layer],
    intro: maps.layers[layer][lang],
    points: getPoints(layer).map((point) => {
      const photo =
        point.mapPhoto && !point.mapPhoto.temporary
          ? point.mapPhoto
          : point.images.find((image) => !image.temporary);
      return {
        slug: point.slug,
        code: point.code,
        layer,
        name: point.name[lang],
        address: point.address,
        hook: point.hook[lang],
        headline: (point.headline ?? point.name)[lang]
          .split("\n")
          .map((line, i) => <RichText key={i} text={line} />),
        photo: photo ? { ...photo, alt: photo.alt[lang] } : null,
        position: mapDesign.pins[point.code],
        route: illustratedMapRoutes[point.code],
      };
    }),
  }));
  return (
    <>
      <div className={h.home}>
        <div
          className={`${h.board} ${s.board}`}
          style={{ "--board": 1672.5 } as CSSProperties}
        >
          <a href={`#map-explorer-${lang}`} className={s.skip}>
            {ui.design.skip}
          </a>
          <HomeHeader lang={lang} current="maps" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.pageFrame}
            src="/maps/v2/page-frame.svg"
            alt=""
            aria-hidden="true"
          />
          <MapPageMotion id={`map-explorer-${lang}`}>
            <h1 className={s.heading}>
              {lang === "vi" ? (
                <>
                  <span className="sr-only">{maps.displayTitle[lang]}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/maps/v2/heading.svg" alt="" aria-hidden="true" />
                </>
              ) : (
                <span className={s.englishHeading}>
                  <span>{ui.design.illustration}</span>
                  {maps.displayTitle[lang]}
                </span>
              )}
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={s.headingRule}
              src="/maps/v2/heading-rule.svg"
              alt=""
              aria-hidden="true"
            />
            <p className={s.lead}>{maps.lead[lang]}</p>
            <DesignMapExplorer
              lang={lang}
              groups={groups}
              artwork={mapDesign.artwork}
              origin={{
                name: mapDesign.origin.name[lang],
                position: mapDesign.origin.position,
              }}
              ui={ui}
            />
          </MapPageMotion>
        </div>
      </div>
      <SiteFooter lang={lang} />
    </>
  );
}
