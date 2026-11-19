import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense, type CSSProperties, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { SiteFooter } from "@/components/site-footer";
import {
  getPoint,
  getPoints,
  points,
  type Point,
  type Season,
} from "@/content";
import { getCurrentUser } from "@/features/auth/queries";
import { FactMark, PhotoMark, PlaceMark } from "@/features/explore/art";
import e from "@/features/explore/explore.module.css";
import { nearbyLabel } from "@/features/explore/nearby";
import { PointCard } from "@/features/explore/point-card";
import { HomeHeader } from "@/features/home/home-header";
import h from "@/features/home/home.module.css";
import { RichText } from "@/features/home/rich-text";
import { Frame } from "@/features/home/sections";
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
  const { point: t, home, layers } = getDictionary(lang);
  const cover = point.images.find((image) => !image.temporary);
  const path = `/${lang}/explore/${slug}`;
  const headline = (point.headline ?? point.name)[lang].split("\n");
  const hookLines = point.hook[lang].split(" / ");
  const otherPoints = getPoints(point.layer).filter(
    (p) => p.slug !== point.slug,
  );

  return (
    <>
      <div className={h.home}>
        <div
          className={`${h.board} ${s.board} ${e.lavenderFrame}`}
          data-layer={point.layer}
        >
          <HomeHeader lang={lang} current="explore" />
          <main>
            <PointMotion className={s.page}>
              {/* 1. Info row */}
              <dl className={s.info}>
                {cells(point, lang).map(({ key, label, value }) => (
                  <div key={key} className={s.cell} data-cell>
                    <dt className="sr-only">{label}</dt>
                    <dd className={s.value}>{value}</dd>
                  </div>
                ))}
              </dl>

              {/* 2. Headline & 3. Hook */}
              <header className={s.header}>
                <h1
                  className={s.headline}
                  style={
                    {
                      "--indent": point.headlineIndent ?? 0,
                    } as CSSProperties
                  }
                  data-reveal
                >
                  {headline.map((line, i) => (
                    <span
                      key={i}
                      className={i > 0 ? s.headlineIndented : s.headlineLine}
                    >
                      <RichText text={line} />
                    </span>
                  ))}
                </h1>

                <blockquote className={s.hook} data-reveal>
                  {hookLines.map((line, i) => (
                    <span key={i} className={s.hookLine}>
                      {line}
                    </span>
                  ))}
                </blockquote>
              </header>

              {/* 4. Price row */}
              <div className={s.priceRow} data-reveal>
                <div className={s.priceCell}>
                  {point.price && <Lines text={point.price[lang]} />}
                </div>
                <div className={s.addressCell}>
                  <span>{point.address}</span>
                  <Link
                    href={`/${lang}/maps?to=${encodeURIComponent(point.slug)}`}
                    className={s.directions}
                  >
                    {t.directions} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className={s.toolsCell}>
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
                  <StatCounts
                    lang={lang}
                    slug={slug}
                    favorites
                    className={s.stats}
                  />
                </div>
              </div>

              {/* 5. Photo & 6. Right column */}
              <div className={s.showcase}>
                <div className={s.photoWrap}>
                  <div className={s.media} data-media>
                    {cover ? (
                      <Image
                        src={cover.src}
                        alt={cover.alt[lang]}
                        fill
                        sizes="(max-width: 48rem) 100vw, 50vw"
                        loading="eager"
                        fetchPriority="high"
                      />
                    ) : (
                      <span className={s.skeleton}>
                        <span className={`meta ${s.chip}`}>
                          {home.imagePlaceholder}
                        </span>
                      </span>
                    )}
                  </div>
                  {point.layer === "place" && (
                    <PhotoMark className={s.photoMark} />
                  )}
                </div>

                <div className={s.rightCol}>
                  <div className={s.story}>
                    {point.story[lang].map((p, i) => (
                      <p key={i} data-wipe>
                        <RichText text={p} />
                      </p>
                    ))}
                  </div>

                  {point.audio && (
                    <section className={s.listen} data-wipe>
                      <h2 className="sr-only">{t.listen}</h2>
                      <audio
                        controls
                        preload="none"
                        src={point.audio}
                        lang="vi"
                      />
                    </section>
                  )}

                  <section className={s.fact} data-wipe>
                    <FactMark className={s.factMark} />
                    <div className={s.factBody}>
                      <h2 className={s.factTitle}>{t.fact}:</h2>
                      <p>{point.fact[lang]}</p>
                    </div>
                  </section>

                  {point.nearby.length > 0 && (
                    <section className={s.nearby} data-unroll>
                      <h2 className={s.nearbyTitle}>{t.nearby}:</h2>{" "}
                      <p className={s.nearbyLinks}>
                        {point.nearby.map((n, i) => {
                          const near = getPoint(n.slug)!;
                          const label = nearbyLabel(
                            (near.shortName ?? near.name)[lang],
                            n.km,
                            lang,
                          );
                          return (
                            <Fragment key={n.slug}>
                              {i > 0 && <span aria-hidden="true"> · </span>}
                              <Link
                                href={`/${lang}/explore/${n.slug}`}
                                className={s.nearbyLink}
                              >
                                {label}
                              </Link>
                            </Fragment>
                          );
                        })}
                      </p>
                    </section>
                  )}
                </div>
              </div>

              {/* 7. Layer section */}
              {otherPoints.length > 0 && (
                <section
                  className={s.layerSection}
                  aria-labelledby="point-layer-heading"
                >
                  <div className={s.layerHeader}>
                    {point.layer === "place" && (
                      <PlaceMark className={s.placeMark} />
                    )}
                    <h2 id="point-layer-heading" className={s.layerHeading}>
                      {layers[point.layer]}
                    </h2>
                  </div>
                  <ul className={s.gates}>
                    {otherPoints.map((other) => (
                      <li key={other.slug} className={s.gateItem} data-unroll>
                        <PointCard point={other} lang={lang} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 8. Comments */}
              <div className={s.commentsWrap} data-wipe>
                <Comments lang={lang} slug={slug} path={path} />
              </div>
            </PointMotion>
          </main>
          <Frame lang={lang} />
        </div>
      </div>
      <SiteFooter lang={lang} />
    </>
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

/** Info bar cells per layer; price lives in the price row for every layer. */
function cells(point: Point, lang: Locale) {
  const t = getDictionary(lang).point;
  const since = point.since?.[lang];
  const hoursLines = point.hours[lang]
    .split(" / ")
    .filter(Boolean)
    .map((line, i) => ({
      key: `hours-${i}`,
      label: t.hours,
      value: <Lines text={line} />,
    }));
  const list: { key: string; label: string; value: ReactNode }[] =
    point.layer === "place"
      ? [
          { key: "since", label: t.year, value: since },
          { key: "kind", label: t.type, value: point.kind[lang] },
          ...hoursLines,
        ]
      : point.layer === "taste"
        ? [
            { key: "dish", label: t.whatToOrder, value: point.kind[lang] },
            { key: "since", label: t.openedSince, value: since },
            {
              key: "hours",
              label: t.hours,
              value: <Lines text={point.hours[lang]} />,
            },
            {
              key: "season",
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
        : [
            { key: "craft", label: t.craft, value: point.kind[lang] },
            {
              key: "hours",
              label: t.hours,
              value: <Lines text={point.hours[lang]} />,
            },
          ];
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
