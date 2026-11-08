import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { crosses } from "@/components/cross";
import { EventList } from "@/components/event-list";
import { getEvents, getPage, layers, points } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getLocale(), "");
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 10" width="16" height="10" aria-hidden="true">
      <path
        d="M0 5h14M10 1l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Home on the prototype A wireframe: hero list of points, intro band, map teaser, events. */
export default async function HomePage() {
  const lang = await getLocale();
  const { home, layers: layerNames, nav, events } = getDictionary(lang);
  const site = getPage("site");
  const { lead, intro } = getPage("home");
  const maps = getPage("maps");

  return (
    <>
      <section className={s.hero}>
        <div className={s.heroHead}>
          <h1 className={s.title}>{site.brand[lang]}</h1>
          <div className={s.heroText}>
            <p className={s.tagline}>{site.tagline[lang]}</p>
            <p>{lead[lang]}</p>
            <p className={s.actions}>
              <Link href={`/${lang}/maps`} className={s.primary}>
                {home.exploreMap}
                <Arrow />
              </Link>
              <Link href={`/${lang}/join`}>{home.joinNetwork}</Link>
            </p>
          </div>
        </div>
        <ol className={s.list} aria-label={home.listLabel}>
          {points.map((p) => {
            const cover = p.images[0];
            return (
              <li key={p.slug} className={s.item} data-layer={p.layer}>
                <Link href={`/${lang}/explore/${p.slug}`} className={s.link}>
                  <span className={`meta ${s.num}`}>
                    {p.code.toUpperCase()}
                  </span>
                  <span className={s.name}>{p.name[lang]}</span>
                  <span className={`meta ${s.where}`}>
                    {layerNames[p.layer]} · {p.address}
                  </span>
                  <span className={s.panel} aria-hidden="true">
                    <span className={s.figure}>
                      {crosses}
                      {cover ? (
                        <Image src={cover.src} alt="" fill sizes="320px" />
                      ) : (
                        <span className={s.label}>
                          {home.imagePlaceholder} · {p.name[lang]}
                        </span>
                      )}
                    </span>
                    <span className={`meta ${s.cap} ${s.capTop}`}>
                      <span>{p.code.toUpperCase()}</span>
                      <span>{layerNames[p.layer]}</span>
                    </span>
                    <span className={`meta ${s.cap} ${s.capBottom}`}>
                      <span>{p.name[lang]}</span>
                      <span>{p.address}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={s.intro}>
        <p className={`meta ${s.introMeta}`}>{site.designation[lang]}</p>
        <h2 className={s.statement}>{intro.title[lang]}</h2>
        <div className={s.introBody}>
          {intro.body[lang].map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className={s.mapSection}>
        <div className={s.card}>
          {crosses}
          <div className={s.cardText}>
            <h2 className={s.teaser}>{maps.title[lang]}</h2>
            <p>{maps.lead[lang]}</p>
            <ol className={s.key}>
              {layers.map((layer) => (
                <li key={layer} className="meta" data-layer={layer}>
                  <span className={s.swatch} aria-hidden="true" />
                  <span className={s.layerName}>{layerNames[layer]}</span>
                  <span>{maps.layers[layer][lang]}</span>
                </li>
              ))}
            </ol>
            <Link href={`/${lang}/maps`} className={s.primary}>
              {home.openMap}
              <Arrow />
            </Link>
          </div>
          <div className={s.map} aria-hidden="true">
            {layers.map((layer) => (
              <span key={layer} className={s.mapLayer} data-layer={layer}>
                <span className="meta">{layerNames[layer]}</span>
              </span>
            ))}
            <span className={`meta ${s.mapNote}`}>{nav.maps}</span>
          </div>
        </div>
      </section>

      <section className={s.events}>
        <div className={s.eventsHead}>
          <h2 className={s.teaser}>{events.title}</h2>
          <Link href={`/${lang}/events`} className={s.primary}>
            {events.seeAll}
            <Arrow />
          </Link>
        </div>
        <EventList
          events={getEvents().slice(0, 3)}
          lang={lang}
          empty={events.empty}
          imageLabel={home.imagePlaceholder}
          heading="h3"
        />
      </section>
    </>
  );
}
