import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { HeaderSearch } from "@/components/header-search";
import { HanoiDate, HomeMenu } from "@/components/home-controls";
import { SiteFooter } from "@/components/site-footer";
import { getPage, layers, points } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), "");
}

/** Geometry uses the 1920-wide artboard's units, not CSS pt. */
function at(x: number, y: number, width: number): CSSProperties {
  return { "--x": x, "--y": y, "--w": width } as CSSProperties;
}

function Art({
  name,
  className,
  priority = false,
}: {
  name: string;
  className?: string;
  priority?: boolean;
}) {
  const art = getPage("home").artwork[name];
  return (
    <Image
      src={art.src}
      width={Math.round(art.width)}
      height={Math.round(art.height)}
      alt=""
      aria-hidden="true"
      className={className}
      preload={priority}
      style={{ aspectRatio: `${art.width} / ${art.height}` }}
    />
  );
}

export default async function HomePage() {
  const lang = await getLocale();
  const { home, nav, search, layers: layerNames } = getDictionary(lang);
  const { design: d, roles } = getPage("home");
  const site = getPage("site");
  const other = lang === "vi" ? "en" : "vi";
  const contentId = `home-content-${lang}`;
  const entryId = `home-entry-${lang}`;
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({
      href: `/${lang}/${key}`,
      label: nav[key],
    }),
  );

  return (
    <>
      <main>
        <div className={s.home}>
          <a href={`#${contentId}`} className={s.skipLink}>
            {home.skipToContent}
          </a>
          <section
            className={s.opening}
            aria-label={site.brand[lang]}
            data-home-design="web-01"
          >
            <a
              href={`#${entryId}`}
              className={s.openingLogo}
              aria-label={home.enterHomepage}
            >
              <Art name="opening-logo" priority />
            </a>
          </section>
          <div className={s.page} data-home-design="web-02">
            <header id={entryId} className={s.header} tabIndex={-1}>
              <div
                className={`${s.placed} ${s.weather}`}
                style={at(180.8, 78, 360)}
              >
                <span
                  title={home.sampleTemperature}
                  aria-label={`${d.temperature} — ${home.sampleTemperature}`}
                >
                  {d.temperature}
                </span>
                <HanoiDate lang={lang} placeholder={home.datePlaceholder} />
              </div>
              <Link
                href={`/${lang}`}
                aria-label={`${site.brand[lang]} — ${nav.home}`}
                className={`${s.placed} ${s.logo}`}
                style={at(860.22, 45.73, 198.87)}
              >
                <Art name="logo" priority />
              </Link>
              <div
                className={`${s.placed} ${s.searchBox}`}
                style={at(1401.03, 67.06, 339.97)}
              >
                <HeaderSearch
                  className={s.homeSearch}
                  label={search.label}
                  empty={search.empty}
                  items={points.map((p) => ({
                    href: `/${lang}/explore/${p.slug}`,
                    name: p.name[lang],
                    layer: p.layer,
                    layerName: layerNames[p.layer],
                  }))}
                />
              </div>
            </header>

            <Art name="frame" className={s.frame} priority />
            <HomeMenu
              openLabel={home.openMenu}
              closeLabel={home.closeMenu}
              title={nav.label}
              mark={<Art name="menu-mark" />}
            >
              <nav aria-label={nav.label} className={s.menuLinks}>
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
                <Link href={`/${lang}/account`}>{nav.account}</Link>
                <Link href={`/${other}`} hrefLang={other} lang={other}>
                  {nav.switchLanguage}
                </Link>
              </nav>
            </HomeMenu>
            <nav className={s.navigation} aria-label={nav.label}>
              <div>
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <section
              id={contentId}
              className={`${s.section} ${s.hero}`}
              tabIndex={-1}
              aria-label={d.heroTitle[lang]}
            >
              <Art name="hero-art" className={s.heroArt} priority />
              <h1
                className={`${s.placed} ${s.heroTitle}`}
                style={at(297.02, 122.56, 948.78)}
              >
                <span className={s.srOnly}>{d.heroTitle[lang]}</span>
                <Art name="hanoi-title" priority />
              </h1>
              <p
                className={`${s.placed} ${s.heroTagline}`}
                style={at(753.65, 355.4, 491.58)}
              >
                <span className={s.srOnly}>{d.heroTagline[lang]}</span>
                <Art name="hero-tagline" priority />
              </p>
            </section>

            <section
              className={`${s.section} ${s.connections}`}
              aria-label={d.connectionsTitle[lang]}
            >
              <h2
                className={`${s.placed} ${s.connectionsTitle}`}
                style={at(42.93, 50.78, 1483.31)}
              >
                <span className={s.srOnly}>{d.connectionsTitle[lang]}</span>
                <Art name="connections-title" />
              </h2>
              <div
                className={`${s.placed} ${s.connectionsArt}`}
                style={at(387.24, 181.37, 785.1)}
              >
                <Art name="connections-art" />
              </div>
              <div
                className={`${s.placed} ${s.introCopy}`}
                style={at(1215.86, 503, 300.75)}
              >
                {d.introParagraphs[lang].map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <Link
                href={`/${lang}/join`}
                className={`${s.placed} ${s.joinLink}`}
                style={at(70.01, 839.22, 228)}
              >
                <Art name="join-mark" />
                <span>{home.joinNetwork}</span>
              </Link>
            </section>

            <section
              className={`${s.section} ${s.infrastructure}`}
              aria-label={home.infrastructureLabel}
            >
              <Art name="infrastructure-ribbon" className={s.ribbon} />
              <dl className={s.infrastructureList}>
                {d.infrastructure.map((item, i) => (
                  <div
                    key={item.artwork}
                    data-tone={item.tone}
                    style={
                      {
                        "--center": [262.215, 591.62, 949.675, 1281.67][i],
                      } as CSSProperties
                    }
                  >
                    <dt>
                      <Art name={item.artwork} />
                      <span>{item.label[lang]}</span>
                    </dt>
                    <dd>{item.count}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              className={`${s.section} ${s.roles}`}
              aria-label={getPage("home").intro.title[lang]}
            >
              <h2
                className={`${s.placed} ${s.thesis}`}
                style={at(44.34, 128.98, 560)}
              >
                {d.thesis.map((line, i) => (
                  <span key={i}>
                    {line.text[lang]}
                    {line.accent && (
                      <em data-tone={line.tone}>{line.accent[lang]}</em>
                    )}
                  </span>
                ))}
              </h2>
              <div
                className={`${s.placed} ${s.rolesArt}`}
                style={at(-0.35, 140.87, 1567.23)}
              >
                <Art name="roles-art" />
              </div>
              <ul className={s.roleLabels}>
                <li
                  className={s.placed}
                  style={at(982.57, 242, 230)}
                  data-tone="red"
                >
                  {roles.state[lang]}
                </li>
                <li
                  className={s.placed}
                  style={at(626.26, 384, 200)}
                  data-tone="gold"
                >
                  {roles.artists[lang]}
                </li>
                <li
                  className={s.placed}
                  style={at(348.06, 504.5, 230)}
                  data-tone="cyan"
                >
                  {roles.public[lang]}
                </li>
              </ul>
            </section>

            <section
              className={`${s.section} ${s.heritage}`}
              aria-label={home.heritageLabel}
            >
              <div
                className={`${s.placed} ${s.wave}`}
                style={at(0.07, 159.87, 328.71)}
              >
                <Art name="wave-mark" />
              </div>
              <h2
                className={`${s.placed} ${s.heritageTitle}`}
                style={at(452.22, 162.19, 1022.43)}
              >
                <span className={s.srOnly}>{d.heritageTitle[lang]}</span>
                <Art name="heritage-title" />
              </h2>
              <p
                className={`${s.placed} ${s.since}`}
                style={at(456.52, 192, 140)}
              >
                {d.since[lang]}
              </p>
              <div className={s.heritageCopy}>
                {d.heritageParagraphs.map((p, i) => (
                  <p
                    key={i}
                    className={s.placed}
                    style={at(i ? 1254.93 : 644.22, 551.5, i ? 218.08 : 223.46)}
                  >
                    {p[lang]}
                  </p>
                ))}
              </div>
              <dl className={s.heritageStats}>
                {d.heritageStats.map((stat, i) => (
                  <div
                    key={stat.count}
                    data-tone={stat.tone}
                    className={s.placed}
                    style={at(
                      i % 2 ? 1194.5 : 643,
                      i < 2 ? 672 : 866.6,
                      i % 2 ? 283.5 : 420,
                    )}
                  >
                    <dt>{stat.label[lang]}</dt>
                    <dd>{stat.count}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              className={`${s.section} ${s.threads}`}
              aria-label={d.threadsTitle[lang]}
            >
              <h2
                className={`${s.placed} ${s.threadsTitle}`}
                style={at(43.74, 140.64, 480.01)}
              >
                <span className={s.srOnly}>{d.threadsTitle[lang]}</span>
                <Art name="threads-title" />
              </h2>
              {layers.map((layer) => (
                <Link
                  key={layer}
                  href={`/${lang}/explore?layer=${layer}`}
                  className={`${s.thread} ${s[layer]}`}
                >
                  <div className={s.threadArt}>
                    <Art name={layer} />
                  </div>
                  <div className={s.threadCaption}>
                    <h3>{d.threads[layer].label[lang]}</h3>
                    <p>{d.threads[layer].description[lang]}</p>
                    <Art name={`${layer}-connector`} className={s.connector} />
                  </div>
                </Link>
              ))}
              <Link
                href={`/${lang}/maps`}
                className={`${s.placed} ${s.mapLink}`}
                style={at(44.48, 683.23, 250)}
              >
                <Art name="map-mark" />
                <span>{home.mapLink}</span>
              </Link>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
