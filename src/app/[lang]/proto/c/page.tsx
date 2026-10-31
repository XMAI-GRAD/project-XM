import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { mockCopy, mockHeritages } from "../_mock";
import s from "./page.module.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-c",
});

export default async function ProtoC({ params }: PageProps<"/[lang]/proto/c">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = mockCopy[lang];
  const other = locales.find((l) => l !== lang)!;
  const nav = [
    { href: `/${lang}/map`, label: t.nav.map },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/account`, label: t.nav.account },
  ];

  return (
    <div className={`${font.variable} ${s.root}`}>
      <header className={s.top}>
        <span className={s.pill}>{t.siteName}</span>
        <nav aria-label={t.siteName} className={s.links}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href={`/${other}/proto/c`} lang={other} hrefLang={other}>
            {other.toUpperCase()}
          </Link>
        </nav>
      </header>

      <section className={s.hero}>
        <h1 className={s.h1}>{t.siteName}</h1>
        <p className={s.tagline}>{t.tagline}</p>
        <ul className={s.grid}>
          {mockHeritages.map((h, i) => (
            <li key={h.slug} className={s.item}>
              <Link href={`/${lang}/heritage/${h.slug}`} className={s.card}>
                <span className={`${s.thumb} ${s[`tone${i}`]}`}>
                  <span className={s.ph}>{t.imagePlaceholder}</span>
                  {i === 0 && (
                    <span className={s.dot}>
                      <span className={s.sr}>{t.routeStart}</span>
                    </span>
                  )}
                </span>
                <span className={s.name}>{h.name[lang]}</span>
                <span className={s.meta}>
                  {h.place[lang]} · {t.unesco} <span className={s.num}>{h.year}</span>
                </span>
                <span className={s.sum}>{h.summary[lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.intro}>
        <p>{t.intro}</p>
      </section>

      <section className={s.mapCard}>
        <svg
          viewBox="10 18 80 110"
          role="img"
          aria-label={t.mapTeaser}
          className={s.svg}
          overflow="visible"
        >
          <polyline
            points={mockHeritages.map((h) => `${h.map.x},${h.map.y}`).join(" ")}
            className={s.route}
          />
          {mockHeritages.map((h, i) => {
            const left = i === 0 || i === 4;
            return (
              <g key={h.slug}>
                <circle cx={h.map.x} cy={h.map.y} r={i === 0 ? 2.6 : 2} className={i === 0 ? s.pinStart : s.pin} />
                <text
                  x={h.map.x + (left ? -4 : 4)}
                  y={h.map.y + 1.6}
                  textAnchor={left ? "end" : "start"}
                  className={s.pinLabel}
                >
                  {h.place[lang]}
                </text>
              </g>
            );
          })}
        </svg>
        <div className={s.mapText}>
          <p className={s.mapLine}>{t.mapTeaser}</p>
          <Link href={`/${lang}/map`} className={s.button}>
            {t.openMap}
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className={s.footer}>
        <nav aria-label={t.siteName} className={s.links}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <a href="mailto:contact@example.com">{t.contact}</a>
        </nav>
        <p className={s.note}>{t.placeholderNote}</p>
      </footer>
    </div>
  );
}
