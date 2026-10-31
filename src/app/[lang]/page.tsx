import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getHeritage, heritages, route } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), "");
}

// Map teaser: fit the viewBox to the pins, whatever units the real map uses.
const stops = route.map((slug) => getHeritage(slug)!);
const xs = stops.map((h) => h.map.x);
const ys = stops.map((h) => h.map.y);
const span =
  Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  ) || 1;
const pad = span * 0.18;
const viewBox = [
  Math.min(...xs) - pad,
  Math.min(...ys) - pad,
  Math.max(...xs) - Math.min(...xs) + pad * 2,
  Math.max(...ys) - Math.min(...ys) + pad * 2,
].join(" ");

export default async function HomePage() {
  const lang = await getLocale();
  const { home, nav, about, footer } = getDictionary(lang);

  return (
    <>
      <section className={s.hero}>
        <h1 className={s.phrase}>{home.title}</h1>

        <div className={s.stage}>
          <div className={s.frame} aria-hidden="true">
            {heritages.map((h, i) => (
              <div key={h.slug} className={s.slide}>
                <Image
                  src={h.images[0].src}
                  alt=""
                  fill
                  sizes="(max-width: 800px) 100vw, 45vw"
                  priority={i === 0}
                  className={s.photo}
                />
                <div className={s.caption}>
                  <p className={s.captionName}>{h.name[lang]}</p>
                  <p className={s.captionSummary}>{h.summary[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ul className={s.names} aria-label={home.listLabel}>
          {heritages.map((h) => (
            <li key={h.slug} className={s.item}>
              <Link href={`/${lang}/heritage/${h.slug}`}>
                <span className={s.thumb} aria-hidden="true">
                  <Image src={h.images[0].src} alt="" fill sizes="48px" />
                </span>
                <span className={s.nameText}>{h.name[lang]}</span>
                <span className={s.sub}>{h.summary[lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.intro}>
        <p>{home.intro}</p>
      </section>

      <section className={s.mapSection}>
        <div className={s.mapFrame}>
          <svg
            viewBox={viewBox}
            role="img"
            aria-label={home.mapLabel}
            className={s.svg}
            style={{ fontSize: span * 0.04 }}
          >
            <polyline
              points={stops.map((h) => `${h.map.x},${h.map.y}`).join(" ")}
              fill="none"
              stroke="var(--paper)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {stops.map((h) => (
              <g key={h.slug}>
                <circle
                  cx={h.map.x}
                  cy={h.map.y}
                  r={span * 0.012}
                  fill="var(--paper)"
                />
                <text
                  x={h.map.x}
                  y={h.map.y - span * 0.035}
                  textAnchor="middle"
                  fill="var(--paper)"
                >
                  {h.name[lang]}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className={s.mapText}>
          <h2>{home.mapTeaser}</h2>
          <Link href={`/${lang}/map`} className={s.cta}>
            {home.openMap}
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
        <nav aria-label={footer.label}>
          <Link href={`/${lang}/map`}>{nav.map}</Link>
          <Link href={`/${lang}/about`}>{nav.about}</Link>
          <Link href={`/${lang}/account`}>{nav.account}</Link>
          <a href={`mailto:${about.contactEmail}`}>{about.contact}</a>
        </nav>
      </footer>
    </>
  );
}
