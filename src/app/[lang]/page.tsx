import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { HomeHeader } from "@/features/home/home-header";
import s from "@/features/home/home.module.css";
import { Opening } from "@/features/home/opening";
import { HomeOpeningMotion } from "@/features/home/opening-motion";
import { HomeSectionLink } from "@/features/home/section-link";
import { getDictionary } from "@/i18n/dictionaries";
import {
  Frame,
  Heritage,
  Hero,
  Layers,
  Roles,
  Stats,
  Thread,
} from "@/features/home/sections";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), "");
}

/**
 * Home: a graphic showcase read as you scroll. The opening slide (WEB-01) runs straight
 * into the page (WEB-02); both are the designer's comps, laid out in comp units
 * (src/features/home/home.module.css). The opening morph uses the extracted SVG paths.
 */
export default async function HomePage() {
  const lang = await getLocale();
  const { home } = getDictionary(lang);
  return (
    <>
      <HomeOpeningMotion className={s.home}>
        <HomeSectionLink
          href={`/${lang}#home-content-${lang}`}
          className={s.skipLink}
        >
          {home.skipToContent}
        </HomeSectionLink>
        <Opening lang={lang} />
        <div className={s.board} data-home-design="web-02">
          <HomeHeader lang={lang} />
          <main>
            <Hero lang={lang} />
            <Thread lang={lang} />
            <Stats lang={lang} />
            <Roles lang={lang} />
            <Heritage lang={lang} />
            <Layers lang={lang} />
          </main>
          <Frame lang={lang} />
        </div>
      </HomeOpeningMotion>
      <SiteFooter lang={lang} />
    </>
  );
}
