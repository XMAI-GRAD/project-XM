import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { Fields, Intro, Timeline, Work } from "@/features/about/about";
import { HomeHeader } from "@/features/home/home-header";
import s from "@/features/home/home.module.css";
import { Frame } from "@/features/home/sections";
import { getPage } from "@/content";
import { getLocale, pageMetadata } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/about", getPage("about").title[lang]);
}

/**
 * About, after the designer's WEB-05: the showcase frame and header of home, then the
 * heading set around the petal, the three roles, the five fields and the timeline.
 * Laid out in comp units like home (src/features/home/home.module.css).
 */
export default async function AboutPage() {
  const lang = await getLocale();
  return (
    <>
      <div className={s.home}>
        <div className={s.board} style={{ "--board": 4320 } as CSSProperties}>
          <HomeHeader lang={lang} current="about" />
          <main>
            <Intro lang={lang} />
            <Work lang={lang} />
            <Fields lang={lang} />
            <Timeline lang={lang} />
          </main>
          <Frame />
        </div>
      </div>
      <SiteFooter lang={lang} />
    </>
  );
}
