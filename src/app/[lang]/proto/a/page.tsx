import { notFound } from "next/navigation";
import Link from "next/link";
import { Archivo, Chivo_Mono } from "next/font/google";
import { hasLocale, type Locale } from "@/i18n/config";
import { mockCopy, mockHeritages } from "../_mock";
import "./a.css";

const display = Archivo({
  subsets: ["latin", "vietnamese"],
  axes: ["wdth"],
  variable: "--font-a-display",
  display: "swap",
});
const mono = Chivo_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-a-mono",
  display: "swap",
});

function Cross({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg className={`pa-cross pa-${pos}`} viewBox="0 0 11 11" aria-hidden="true">
      <path d="M5.5 0v11M0 5.5h11" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 10" width="16" height="10" aria-hidden="true">
      <path d="M0 5h14M10 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default async function ProtoA({ params }: PageProps<"/[lang]/proto/a">) {
  const { lang: raw } = await params;
  if (!hasLocale(raw)) notFound();
  const lang: Locale = raw;
  const t = mockCopy[lang];
  const other: Locale = lang === "vi" ? "en" : "vi";
  const first = mockHeritages[0];
  const last = mockHeritages[mockHeritages.length - 1];
  const years = mockHeritages.map((h) => h.year);
  const nav = [
    { href: `/${lang}/map`, label: t.nav.map },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/account`, label: t.nav.account },
  ];
  const pad = (i: number) => String(i + 1).padStart(2, "0");
  const pts = mockHeritages.map((h) => `${h.map.x},${h.map.y}`).join(" ");

  return (
    <div className={`${display.variable} ${mono.variable} pa-root`}>
      <div className={"pa-shell"}>
        <aside className={"pa-rail"}>
          <span className={"pa-logo"}>{t.siteName}</span>
          <a className={"pa-cta"} href="#index">
            <span>{t.explore}</span>
            <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true">
              <path d="M5 0v14M1 10l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </a>
        </aside>

        <div className={"pa-content"}>
          <header className={"pa-topbar"}>
            <p className={`pa-meta pa-route`}>
              <span>{t.siteName}</span>
              <span className={"pa-sep"} aria-hidden="true" />
              <span>{first.place[lang]}</span>
              <Arrow className={"pa-routeArrow"} />
              <span>{last.place[lang]}</span>
            </p>
            <nav className={"pa-nav"} aria-label="Primary">
              {nav.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
              <Link href={`/${other}/proto/a`} lang={other} hrefLang={other} className={"pa-lang"}>
                {other.toUpperCase()}
              </Link>
            </nav>
          </header>

          <section className={"pa-hero"} id="index">
            <div className={"pa-heroHead"}>
              <h1 className={"pa-title"}>{t.siteName}</h1>
              <p className={"pa-tagline"}>{t.tagline}</p>
            </div>
            <ol className={"pa-list"}>
              {mockHeritages.map((h, i) => (
                <li key={h.slug} className={"pa-item"}>
                  <Link href={`/${lang}/heritage/${h.slug}`} className={"pa-link"}>
                    <span className={`pa-meta pa-num`}>{pad(i)}</span>
                    <span className={"pa-name"}>{h.name[lang]}</span>
                    <span className={`pa-meta pa-where`}>
                      {h.place[lang]} · {t.unesco} {h.year}
                    </span>
                    <span className={"pa-panel"} aria-hidden="true">
                      <span className={"pa-figure"}>
                        <Cross pos="tl" />
                        <Cross pos="tr" />
                        <Cross pos="bl" />
                        <Cross pos="br" />
                        <span className={"pa-label"}>
                          {t.imagePlaceholder} · {h.name[lang]}
                        </span>
                      </span>
                      <span className={`pa-meta pa-cap pa-capTop`}>
                        <span>{pad(i)}</span>
                        <span>{h.year}</span>
                      </span>
                      <span className={`pa-meta pa-cap pa-capBottom`}>
                        <span>{h.name[lang]}</span>
                        <span>{h.place[lang]}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className={"pa-intro"}>
            <p className={`pa-meta pa-introMeta`}>
              {t.unesco} {Math.min(...years)}–{Math.max(...years)}
            </p>
            <p className={"pa-statement"}>{t.intro}</p>
          </section>

          <section className={"pa-mapSection"}>
            <div className={"pa-card"}>
              <Cross pos="tl" />
              <Cross pos="tr" />
              <Cross pos="bl" />
              <Cross pos="br" />
              <div className={"pa-cardText"}>
                <p className={"pa-teaser"}>{t.mapTeaser}</p>
                <ol className={"pa-key"}>
                  {mockHeritages.map((h, i) => (
                    <li key={h.slug} className={"pa-meta"}>
                      <span className={"pa-num"}>{pad(i)}</span>
                      <span>{h.name[lang]}</span>
                    </li>
                  ))}
                </ol>
                <Link href={`/${lang}/map`} className={"pa-primary"}>
                  {t.openMap}
                  <Arrow />
                </Link>
              </div>
              <svg
                className={"pa-map"}
                viewBox="0 0 100 200"
                role="img"
                aria-label={`${t.mapTeaser} ${first.place[lang]} – ${last.place[lang]}`}
              >
                {[40, 80, 120, 160].map((y) => (
                  <line key={y} x1="0" x2="100" y1={y} y2={y} className={"pa-grid"} />
                ))}
                {[25, 50, 75].map((x) => (
                  <line key={x} x1={x} x2={x} y1="0" y2="200" className={"pa-grid"} />
                ))}
                <polyline points={pts} className={"pa-routeLine"} />
                {mockHeritages.map((h, i) => {
                  const left = i === 0 || i === 2 || i === 4;
                  return (
                    <g key={h.slug}>
                      <circle cx={h.map.x} cy={h.map.y} r="1.8" className={"pa-pin"} />
                      <text
                        x={h.map.x + (left ? -3.4 : 3.4)}
                        y={h.map.y + 1.4}
                        textAnchor={left ? "end" : "start"}
                        className={"pa-pinLabel"}
                      >
                        {pad(i)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          <footer className={"pa-footer"}>
            <nav className={"pa-footNav"} aria-label="Footer">
              {nav.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
              <a href="mailto:contact@example.com">{t.contact}</a>
            </nav>
            <p className={"pa-meta"}>{t.placeholderNote}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
