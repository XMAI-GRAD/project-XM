import Link from "next/link";
import { HeaderSearch } from "@/components/header-search";
import { LangSwitch } from "@/components/lang-switch";
import { getPage, points } from "@/content";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Logo, logoBox, SearchFrame, searchFrameBox } from "./art";
import s from "./home.module.css";
import { at } from "./place";
import { Today } from "./today";

/** Home's own header: weather and date, the logo, VI | EN, search, then the nav tab. */
export function HomeHeader({ lang }: { lang: Locale }) {
  const { nav, search, home, layers } = getDictionary(lang);
  const site = getPage("site");
  const { weather } = getPage("home");
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({ href: `/${lang}/${key}`, label: nav[key] }),
  );

  return (
    <header
      id={`home-entry-${lang}`}
      tabIndex={-1}
      className={`${s.section} ${s.header}`}
    >
      <p className={`${s.at} ${s.weather}`}>
        <span aria-label={`${home.weather}: ${weather}`}>{weather}</span>
        <span>
          <Today lang={lang} />
        </span>
      </p>

      <Link
        href={`/${lang}`}
        className={`${s.at} ${s.logo}`}
        style={at(logoBox)}
        aria-label={site.brand[lang]}
        data-header-logo
      >
        <Logo />
      </Link>

      <div
        role="group"
        aria-label={home.language}
        className={`${s.at} ${s.lang}`}
      >
        {locales.map((l) =>
          l === lang ? (
            <span key={l} lang={l} aria-current="true">
              {l.toUpperCase()}
            </span>
          ) : (
            <LangSwitch key={l} to={l} label={l.toUpperCase()} />
          ),
        )}
      </div>

      <div className={`${s.at} ${s.search}`} style={at(searchFrameBox)}>
        <SearchFrame />
        <HeaderSearch
          className={s.searchField}
          items={points.map((p) => ({
            href: `/${lang}/explore/${p.slug}`,
            name: p.name[lang],
            layer: p.layer,
            layerName: layers[p.layer],
          }))}
          label={search.label}
          empty={search.empty}
        />
      </div>

      <div className={s.tab} aria-hidden="true" />
      <nav className={s.nav} aria-label={nav.label}>
        {links.map((n) => (
          <Link key={n.href} href={n.href}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
