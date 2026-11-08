import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPage, getPoints, layers } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/maps", getPage("maps").title[lang]);
}

const iconPaths = {
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  reset: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 12h8m-4-4v8",
};

function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={iconPaths[name]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Stage one: composition only. Map interactions follow once artwork is aligned.
export default async function MapsPage() {
  const lang = await getLocale();
  const maps = getPage("maps");
  const site = getPage("site");
  const { maps: ui, layers: layerNames, nav, explore } = getDictionary(lang);
  const groups = layers.map((layer) => ({ layer, points: getPoints(layer) }));
  const count = groups.reduce((total, group) => total + group.points.length, 0);
  const featured = groups.flatMap((group) => group.points)[0];
  const cover = featured?.images[0];

  return (
    <div className={s.page}>
      <header className={s.heading}>
        <div>
          <p className={`meta ${s.eyebrow}`}>
            <span aria-hidden="true" />
            {nav.maps}
          </p>
          <h1>{maps.title[lang]}</h1>
        </div>
        <p className={s.lead}>{maps.lead[lang]}</p>
      </header>

      <div className={s.workspace}>
        <aside className={s.sidebar} aria-label={ui.places}>
          <div className={s.sidebarHeader}>
            <label className={s.search}>
              <Icon name="search" />
              <span className="sr-only">{ui.search}</span>
              <input
                type="search"
                placeholder={ui.searchPlaceholder}
                disabled
              />
            </label>
            <div className={s.layerButtons} role="group" aria-label={ui.layers}>
              {layers.map((layer) => (
                <button key={layer} type="button" data-layer={layer} disabled>
                  <span className={s.layerDot} aria-hidden="true" />
                  {layerNames[layer]}
                </button>
              ))}
            </div>
          </div>

          <div className={s.listHeading}>
            <h2 className="meta">{ui.places}</h2>
            <span className={s.count}>{String(count).padStart(2, "0")}</span>
          </div>
          <div className={s.locations}>
            {groups.map(({ layer, points }) => (
              <section key={layer} className={s.group} data-layer={layer}>
                <div className={s.groupHeading}>
                  <h3>
                    <span className={s.layerDot} aria-hidden="true" />
                    {layerNames[layer]}
                  </h3>
                  <p>{maps.layers[layer][lang]}</p>
                </div>
                {points.length ? (
                  <ul>
                    {points.map((point) => (
                      <li key={point.slug}>
                        <Link
                          href={`/${lang}/explore/${point.slug}`}
                          className={s.location}
                        >
                          <span className={s.pointCode}>{point.code}</span>
                          <span className={s.locationText}>
                            <strong>{point.name[lang]}</strong>
                            <span>{point.address}</span>
                          </span>
                          <Icon name="arrow" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={s.empty}>{explore.empty}</p>
                )}
              </section>
            ))}
          </div>
          <div className={s.sidebarFooter}>
            <span className={s.layerSwatches} aria-hidden="true">
              {layers.map((layer) => (
                <i key={layer} data-layer={layer} />
              ))}
            </span>
            <span className="meta">{ui.layers}</span>
          </div>
        </aside>

        <section className={s.canvas} aria-label={ui.canvas}>
          <Image
            className={s.artwork}
            src={maps.artwork.src}
            alt={maps.artwork.alt[lang]}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1400px) calc(100vw - 448px), calc(100vw - 488px)"
          />
          <div className={s.canvasHeader}>
            <p className={`meta ${s.canvasTitle}`}>{ui.canvas}</p>
            <span className={s.preview}>{ui.preview}</span>
          </div>

          {featured && (
            <article
              className={s.placeCard}
              data-layer={featured.layer}
              aria-labelledby="map-place-name"
            >
              {cover && (
                <Image
                  className={s.cover}
                  src={cover.src}
                  alt={cover.alt[lang]}
                  width={cover.width}
                  height={cover.height}
                  sizes="280px"
                />
              )}
              <div className={s.cardBody}>
                <p className={`meta ${s.cardMeta}`}>
                  <span>
                    {featured.code} / {layerNames[featured.layer]}
                  </span>
                  <span>{ui.sampleCard}</span>
                </p>
                <h2 id="map-place-name">{featured.name[lang]}</h2>
                <p className={s.address}>{featured.address}</p>
                <p className={s.hook}>{featured.hook[lang]}</p>
                <Link
                  className={s.detailLink}
                  href={`/${lang}/explore/${featured.slug}`}
                >
                  {ui.viewDetails}
                  <Icon name="arrow" />
                </Link>
              </div>
            </article>
          )}

          <div className={s.canvasFooter}>
            <p className={`meta ${s.credit}`}>{site.brand[lang]}</p>
            <div className={s.controls} role="group" aria-label={ui.controls}>
              <button
                type="button"
                disabled
                aria-label={ui.zoomIn}
                title={ui.zoomIn}
              >
                <Icon name="plus" />
              </button>
              <button
                type="button"
                disabled
                aria-label={ui.zoomOut}
                title={ui.zoomOut}
              >
                <Icon name="minus" />
              </button>
              <button
                type="button"
                disabled
                aria-label={ui.resetView}
                title={ui.resetView}
              >
                <Icon name="reset" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
