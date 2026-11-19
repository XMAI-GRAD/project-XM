import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { getPage } from "@/content";
import e from "@/features/explore/explore.module.css";
import { LayerSlide } from "@/features/explore/layer-slide";
import { HomeHeader } from "@/features/home/home-header";
import s from "@/features/home/home.module.css";
import { Frame } from "@/features/home/sections";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/explore", getPage("explore").title[lang]);
}

/**
 * Explore, after ĐỊA.svg (1920 × 1436): the showcase frame and header of home, then
 * one slide per layer. ĐỊA is designed; VỊ and NGHỀ join as their comps arrive.
 */
export default async function ExplorePage() {
  const lang = await getLocale();
  const explore = getPage("explore");
  return (
    <>
      <div className={s.home}>
        <div
          className={`${s.board} ${e.lavenderFrame}`}
          style={{ "--board": 1436 } as CSSProperties}
        >
          <HomeHeader lang={lang} current="explore" />
          <main>
            <h1 className="sr-only">{explore.title[lang]}</h1>
            <LayerSlide layer="place" lang={lang} />
          </main>
          <Frame lang={lang} />
        </div>
      </div>
      <SiteFooter lang={lang} />
    </>
  );
}
