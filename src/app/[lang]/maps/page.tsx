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
            {/* Exact source path from /maps/v2/heading-rule.svg, exposed for DrawSVG. */}
            <svg
              className={s.headingRule}
              viewBox="704.6 364.4 688.5 20"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M704.6,365.4h382.7c0.2,1.6-0.1,7.6,4.9,12.3c5.3,5,11.5,5.6,13,5.6h287.9"
                stroke="#C68FFF"
                strokeWidth="2"
                strokeMiterlimit="10"
              />
            </svg>
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
