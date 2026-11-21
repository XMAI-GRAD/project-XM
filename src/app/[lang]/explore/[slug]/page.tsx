import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import {
  detailPhoto,
  getPage,
  getPoint,
  getPoints,
  points,
  type Point,
  type Season,
} from "@/content";
import { FactMark, PhotoMark, PlaceMark } from "@/features/explore/art";
import e from "@/features/explore/explore.module.css";
import { nearbyLabel } from "@/features/explore/nearby";
import { PointCard } from "@/features/explore/point-card";
import { HomeHeader } from "@/features/home/home-header";
import h from "@/features/home/home.module.css";
import { RichText } from "@/features/home/rich-text";
import { Frame } from "@/features/home/sections";
import { Comments } from "@/features/interactions/comments";
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
  const heroPhoto = detailPhoto(point.images);
  const path = `/${lang}/explore/${slug}`;
  const headline = (point.headline ?? point.name)[lang].split("\n");
  const hookLines = point.hook[lang].split(" / ");
  const otherPoints = getPoints(point.layer).filter(
    (p) => p.slug !== point.slug,
  );
  const layerCaption = getPage("home").layers[point.layer][lang];

  return (
    <>
      <div className={h.home}>
        <div
          className={`${h.board} ${s.board} ${e.lavenderFrame}`}
          data-layer={point.layer}
          data-slug={point.slug}
        >
          <HomeHeader lang={lang} current="explore" />
          <main>
            <PointMotion
              key={slug}
              slug={slug}
              heroSize={
                heroPhoto
                  ? { width: heroPhoto.width, height: heroPhoto.height }
                  : undefined
              }
              className={s.page}
            >
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

              {/* 4. Price, address & directions row */}
              <div className={s.priceRow} data-reveal>
                <div className={s.priceCell}>
                  {point.price && <Lines text={point.price[lang]} />}
                </div>
                <div className={s.addressCell}>
                  <span>{point.address}</span>
                </div>
                <div className={s.directionsCell}>
                  <Link
                    href={`/${lang}/maps?to=${encodeURIComponent(point.slug)}`}
                    className={s.directions}
                    aria-label={t.directionsTo.replace(
                      "{name}",
                      point.name[lang],
                    )}
                  >
                    <DirectionsPin className={s.directionsPin} />
                    <span>{t.directions}</span>
                  </Link>
                </div>
              </div>

              {/* 5. Photo & 6. Right column */}
              <div className={s.showcase}>
                <div className={s.photoWrap}>
                  <div className={s.media} data-media>
                    {heroPhoto ? (
                      <Image
                        src={heroPhoto.src}
                        alt={heroPhoto.alt[lang]}
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
                  data-point-gates=""
                >
                  <div className={s.layerHeader} data-gate-header="">
                    {point.layer === "place" && (
                      <PlaceMark className={s.placeMark} />
                    )}
                    <h2 id="point-layer-heading" className={s.layerHeading}>
                      {layers[point.layer]}
                    </h2>
                    <LayerLine className={s.layerLine} />
                    <p className={s.layerCaption}>{layerCaption}</p>
                  </div>
                  <ul className={s.gates}>
                    {otherPoints.map((other) => (
                      <li
                        key={other.slug}
                        className={s.gateItem}
                        data-unroll
                        data-explore-gate=""
                      >
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

/** Sunflower-gold gate/pin mark beside CHỈ ĐƯỜNG in the detail comp. */
function DirectionsPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 23 29"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M11.5 0C5.15 0 0 5.15 0 11.5V24.5C4.5 24.5 8.5 26 11.5 29C14.5 26 18.5 24.5 23 24.5V11.5C23 5.15 17.85 0 11.5 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Stepped mauve rule connecting the ĐỊA heading to its caption. */
function LayerLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 966 20"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-layer-line
    >
      <path
        d="M0 1H615C615 11.5 623.5 19 634 19H966"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
