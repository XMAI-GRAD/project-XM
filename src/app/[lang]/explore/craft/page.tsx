import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { getPage } from "@/content";
import e from "@/features/explore/place/explore.module.css";
import { LayerSlide } from "@/features/explore/place/layer-slide";
import { HomeHeader } from "@/features/home/home-header";
import s from "@/features/home/home.module.css";
import { Frame } from "@/features/home/sections";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  const { layers } = getDictionary(lang);
  return pageMetadata(
    lang,
    "/explore/craft",
    `${layers.craft} · ${getPage("explore").title[lang]}`,
  );
}

/**
 * Explore · NGHỀ. Its comp hasn't arrived: until it does, the page borrows the ĐỊA
 * slide's layout with this layer's points. It is a page of its own, to be designed
 * on its own.
 */
export default async function ExploreCraftPage() {
  const lang = await getLocale();
  const explore = getPage("explore");
  return (
    <>
      <div className={s.home}>
        <div
          className={`${s.board} ${e.lavenderFrame}`}
          style={{ "--board": 1436 } as CSSProperties}
        >
          <HomeHeader lang={lang} current="explore" layer="craft" />
          <main>
            <h1 className="sr-only">{explore.title[lang]}</h1>
            <LayerSlide layer="craft" lang={lang} />
          </main>
          <Frame lang={lang} />
        </div>
      </div>
      <SiteFooter lang={lang} />
    </>
  );
}
