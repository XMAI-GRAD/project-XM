import { Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { mockCopy, mockHeritages } from "../_mock";
import s from "./page.module.css";

const font = Hanken_Grotesk({
  variable: "--font-b",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

// Flat dark tones per site: moss, clay, slate, ochre, brick.
const tones = ["#1f2a1d", "#2e211c", "#1c2530", "#2b2616", "#2f1c1b"];

export default async function ProtoB({ params }: PageProps<"/[lang]/proto/b">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = mockCopy[lang];
  const other = lang === "vi" ? "en" : "vi";
  const links = [
    { href: `/${lang}/map`, label: t.nav.map },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/proto/b/login`, label: t.nav.account },
  ];
  const route = mockHeritages.map((h) => `${h.map.x},${h.map.y}`).join(" ");
  // Labels flip side where pins sit close together.
  const labelLeft = [true, false, true, false, true];

  return (
    <div className={`${font.variable} ${s.root}`}>
      <nav className={s.pill} aria-label={t.primaryNavLabel}>
        <span className={s.pillName}>{t.siteName}</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        <Link href={`/${other}/proto/b`} lang={other} hrefLang={other}>
          {t.switchLang}
        </Link>
      </nav>

      <section className={s.hero}>
        <h1 className={s.phrase}>{t.heroPhrase}</h1>

        <div className={s.stage}>
          <div className={s.frame} aria-hidden="true">
            {mockHeritages.map((h, i) => (
              <div
                key={h.slug}
                className={s.slide}
                style={{ background: tones[i] }}
              >
                <p className={s.slideLabel}>
                  {t.imagePlaceholder} · {h.name[lang]}
                </p>
                <p className={s.slideMeta}>
                  {h.place[lang]} ·{" "}
                  <span className={s.num}>{h.year[lang]}</span>
                </p>
              </div>
            ))}
          </div>
          <p className={s.tagline}>{t.tagline}</p>
        </div>

        <ul className={s.names} aria-label={t.heroListLabel}>
          {mockHeritages.map((h, i) => (
            <li key={h.slug} className={s.item}>
              <Link href={`/${lang}/heritage/${h.slug}`}>
                <span
                  className={s.swatch}
                  style={{ background: tones[i] }}
                  aria-hidden="true"
                />
                <span className={s.nameText}>{h.name[lang]}</span>
                <span className={s.sub}>
                  {h.place[lang]} ·{" "}
                  <span className={s.num}>{h.year[lang]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.intro}>
        <p>{t.intro}</p>
      </section>

      <section className={s.mapSection}>
        <div className={s.mapFrame}>
          <svg
            viewBox="10 18 80 110"
            role="img"
            aria-label={t.mapLabel}
            className={s.svg}
          >
            <polyline
              points={route}
              fill="none"
              stroke="var(--fg)"
              strokeWidth="0.4"
            />
            {mockHeritages.map((h, i) => (
              <g key={h.slug}>
                <circle cx={h.map.x} cy={h.map.y} r="1.6" fill="var(--fg)" />
                <text
                  x={h.map.x + (labelLeft[i] ? -3.2 : 3.2)}
                  y={h.map.y + 1.2}
                  textAnchor={labelLeft[i] ? "end" : "start"}
                  className={s.pinLabel}
                >
                  {h.place[lang]}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className={s.mapText}>
          <h2>{t.mapTeaser}</h2>
          <Link href={`/${lang}/map`} className={s.cta}>
            {t.openMap}
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path
                d="M2 8h11M9 4l4 4-4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Link>
        </div>
      </section>

      <footer className={s.footer}>
        <nav aria-label={t.footerNavLabel}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <a href="mailto:contact@example.com">{t.contact}</a>
        </nav>
        <p>{t.placeholderNote}</p>
      </footer>
    </div>
  );
}
