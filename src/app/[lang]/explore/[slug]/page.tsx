import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { getPoint, points, type Point, type Season } from "@/content";
import { getCurrentUser } from "@/features/auth/queries";
import { Comments } from "@/features/interactions/comments";
import { FavoriteButton, Heart } from "@/features/interactions/favorite-button";
import f from "@/features/interactions/favorite-button.module.css";
import { getMyFavoriteSlugs } from "@/features/interactions/queries";
import { StatCounts } from "@/features/interactions/stat-counts";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";
import { PointMotion } from "./point-motion";
import { StickyName } from "./sticky-name";

// ponytail: the page awaits `params` outside <Suspense>, so client navigations
// block on the server. Fine for prerendered pages. For instant navigation, move
// the `params` read into children inside <Suspense> and drop this (SPEC appendix).
export const instant = false;

export function generateStaticParams() {
  return points.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/explore/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const point = getPoint(slug);
  if (!point) notFound();
  const lang = await getLocale();
  return pageMetadata(lang, `/explore/${slug}`, point.name[lang]);
}

const seasons: Season[] = ["spring", "summer", "autumn", "winter"];

export default async function PointPage({
  params,
}: PageProps<"/[lang]/explore/[slug]">) {
  const { slug } = await params;
  const point = getPoint(slug);
  if (!point) notFound();
  const lang = await getLocale();
  const { point: t, home, nav, layers } = getDictionary(lang);
  const cover = point.images[0];
  const path = `/${lang}/explore/${slug}`;

  return (
    <PointMotion className={s.page}>
      <header className={s.hero}>
        <div className={s.media} data-media>
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt[lang]}
              fill
              sizes="(max-width: 48rem) 100vw, calc(100vw - 64px)"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <span className={s.skeleton}>
              <span className={`meta ${s.chip}`}>{home.imagePlaceholder}</span>
            </span>
          )}
        </div>

        <div className={s.heroTop}>
          <Link href={`/${lang}/explore`} className={s.back}>
            <svg viewBox="0 0 16 10" width="16" height="10" aria-hidden="true">
              <path
                d="M16 5H2M6 1 2 5l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            {nav.explore}
          </Link>
          <ErrorBoundary fallback={null}>
            <Suspense
              fallback={
                <button
                  type="button"
                  disabled
                  className={f.button}
                  aria-label={t.favorite}
                >
                  <Heart filled={false} />
                </button>
              }
            >
              <Favorite lang={lang} slug={slug} />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className={s.heroText}>
          <h1 className={s.name} data-reveal>
            {point.name[lang]}
          </h1>
          <div className={s.heroFoot} data-reveal>
            <span className={`meta ${s.tag}`}>{layers[point.layer]}</span>
            <span className={s.address}>
              <svg
                viewBox="0 0 12 16"
                width="12"
                height="16"
                aria-hidden="true"
              >
                <path
                  d="M6 15S1 9.6 1 6a5 5 0 0 1 10 0c0 3.6-5 9-5 9Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              </svg>
              {point.address}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={s.directions}
            >
              {t.directions}
              <svg
                viewBox="0 0 16 10"
                width="16"
                height="10"
                aria-hidden="true"
              >
                <path
                  d="M0 5h14M10 1l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </a>
            <StatCounts
              lang={lang}
              slug={slug}
              favorites
              className={`meta ${s.stats}`}
            />
          </div>
        </div>
      </header>

      <dl className={s.info}>
        {cells(point, lang).map(({ label, value, lead }) => (
          <div key={label} className={lead ? s.cellLead : s.cell} data-cell>
            <dt className="meta">{label}</dt>
            <dd className={lead ? s.valueLead : s.value}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={s.body}>
        <div className={s.main}>
          <StickyName
            name={
              point.layer === "craft"
                ? `${point.name[lang]} — ${layers.craft} ${point.kind[lang]}`
                : point.name[lang]
            }
          />

          {point.audio && (
            <section className={s.listen}>
              <h2 className="meta">{t.listen}</h2>
              <audio controls preload="none" src={point.audio} lang="vi" />
            </section>
          )}

          <blockquote className={s.hook}>
            {point.hook[lang].split(" / ").map((line) => (
              <span key={line} data-unroll>
                {line}
              </span>
            ))}
          </blockquote>

          <div className={s.story}>
            {point.story[lang].map((p, i) => (
              <p key={i} data-wipe>
                {p}
              </p>
            ))}
          </div>

          <section className={s.fact} data-wipe>
            <h2 className={s.factTitle}>{t.fact}</h2>
            <p>{point.fact[lang]}</p>
          </section>

          {point.nearby.length > 0 && (
            <section className={s.nearby}>
              <h2 className={s.sectionTitle} data-unroll>
                {t.nearby}
              </h2>
              <ul className={s.nearbyList}>
                {point.nearby.map((n) => {
                  const near = getPoint(n.slug)!;
                  return (
                    <li key={n.slug} data-unroll>
                      <Link
                        href={`/${lang}/explore/${n.slug}`}
                        className={s.nearbyLink}
                      >
                        <span className={s.nearbyName}>{near.name[lang]}</span>
                        <span className="meta">{near.kind[lang]}</span>
                        <span className={s.km}>
                          {n.km.toLocaleString(lang)} km
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className={s.aside} data-wipe>
          <Comments lang={lang} slug={slug} path={path} />
        </aside>
      </div>
    </PointMotion>
  );
}

/** Hours and prices: one entry per line (" / " in the YAML), a line in parentheses is a small note, and a range never breaks. */
function Lines({ text }: { text: string }) {
  return text.split(" / ").map((line) => (
    <span key={line} className={line.startsWith("(") ? s.note : s.line}>
      {line.split(/(\S+[-–]\S+)/).map((part, p) =>
        p % 2 ? (
          <span key={part} className={s.range}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  ));
}

/** Info bar cells per layer; the first leads (SPEC Part 1, Point detail). */
function cells(point: Point, lang: Locale) {
  const t = getDictionary(lang).point;
  const hours = { label: t.hours, value: <Lines text={point.hours[lang]} /> };
  const price = point.price && <Lines text={point.price[lang]} />;
  const since = point.since?.[lang];
  const list: { label: string; value: ReactNode; lead?: boolean }[] =
    point.layer === "place"
      ? [
          { label: t.year, value: since, lead: true },
          { label: t.type, value: point.kind[lang] },
          hours,
          { label: t.ticket, value: price },
        ]
      : point.layer === "taste"
        ? [
            { label: t.whatToOrder, value: point.kind[lang], lead: true },
            { label: t.openedSince, value: since },
            { label: t.price, value: price },
            hours,
            {
              label: t.season,
              value: point.season && (
                <ol className={s.seasons}>
                  {seasons.map((season) => (
                    <li
                      key={season}
                      className={
                        season === point.season ? s.seasonOn : undefined
                      }
                      aria-current={
                        season === point.season ? "true" : undefined
                      }
                    >
                      {t.seasons[season]}
                    </li>
                  ))}
                </ol>
              ),
            },
          ]
        : [{ label: t.craft, value: point.kind[lang], lead: true }, hours];
  return list.filter((cell) => cell.value);
}

async function Favorite({ lang, slug }: { lang: Locale; slug: string }) {
  const { point, errors } = getDictionary(lang);
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/${lang}/explore/${slug}`);
    return (
      <Link
        href={`/${lang}/login?next=${next}`}
        className={f.button}
        aria-label={point.favorite}
      >
        <Heart filled={false} />
      </Link>
    );
  }
  const favorites = await getMyFavoriteSlugs();
  return (
    <FavoriteButton
      slug={slug}
      initialFavorited={favorites.includes(slug)}
      dict={{ point, errors }}
    />
  );
}
