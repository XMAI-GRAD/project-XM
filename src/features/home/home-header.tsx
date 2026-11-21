import Link from "next/link";
import { HeaderSearch } from "@/components/header-search";
import { getPage, layers as layerKeys, points, type Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  FrameLeft,
  frameLeftBox,
  FrameRight,
  frameRightBox,
  Logo,
  logoBox,
  SearchFrame,
  searchFrameBox,
} from "./art";
import s from "./home.module.css";
import { at } from "./place";
import { Today } from "./today";
import { ExploreMenu } from "./explore-menu";
import { HomeHeaderMotion } from "./header-motion";
import { HomeSectionLink } from "./section-link";
import { pointHref } from "@/features/explore/paths";

/**
 * The showcase header (home, about, explore): weather and date, the logo, search,
 * then the nav tab, with the current page marked. Khám phá on the tab opens a choice
 * of the three layers rather than a page.
 */
export function HomeHeader({
  lang,
  current,
  layer,
}: {
  lang: Locale;
  /** The page this header sits on, marked on the nav tab. */
  current?: "about" | "explore" | "maps" | "events" | "join";
  /** On an explore page: its layer, marked in Khám phá's list. */
  layer?: Layer;
}) {
  const { nav, search, home, layers } = getDictionary(lang);
  const site = getPage("site");
  const { weather } = getPage("home");
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({ key, href: `/${lang}/${key}`, label: nav[key] }),
  );

  return (
    <HomeHeaderMotion
      id={current ? `${current}-header-${lang}` : `home-entry-${lang}`}
      className={`${s.section} ${s.header}`}
    >
      <p className={`${s.at} ${s.weather}`} data-header-weather>
        <span aria-label={`${home.weather}: ${weather}`}>{weather}</span>
        <span>
          <Today lang={lang} />
        </span>
      </p>

      <HomeSectionLink
        href={`/${lang}#home-entry-${lang}`}
        className={`${s.at} ${s.logo}`}
        style={at(logoBox)}
        aria-label={site.brand[lang]}
        data-header-logo
        data-brand-return-label={home.backToHeader}
      >
        <Logo />
      </HomeSectionLink>

      <div className={`${s.at} ${s.search}`} style={at(searchFrameBox)}>
        <SearchFrame />
        <HeaderSearch
          className={s.searchField}
          items={points.map((p) => ({
            href: pointHref(lang, p),
            name: p.name[lang],
            layer: p.layer,
            layerName: layers[p.layer],
          }))}
          label={search.label}
          empty={search.empty}
        />
      </div>

      <div className={s.tab} aria-hidden="true" />
      <div className={s.headerFrame} aria-hidden="true">
        <FrameLeft className={s.at} style={at(frameLeftBox)} />
        <FrameRight className={s.at} style={at(frameRightBox)} />
      </div>
      <nav className={s.nav} aria-label={nav.label}>
        {links.map((n) =>
          n.key === "explore" ? (
            <ExploreMenu
              key={n.key}
              label={n.label}
              items={layerKeys.map((key) => ({
                layer: key,
                href: `/${lang}/explore/${key}`,
                name: layers[key],
              }))}
              current={current === "explore"}
              currentLayer={layer}
            />
          ) : (
            <Link
              key={n.href}
              href={n.href}
              className={s.navLink}
              aria-current={n.key === current ? "page" : undefined}
            >
              {n.label}
            </Link>
          ),
        )}
      </nav>
    </HomeHeaderMotion>
  );
}
