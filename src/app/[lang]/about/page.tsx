import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { getPage } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";
import { Video } from "./video";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/about", getPage("about").title[lang]);
}

/**
 * About (SPEC Part 1): title and lede, intro and video, three things the Centre does,
 * five fields, timeline (the navy band), operators, then the join CTA.
 */
export default async function AboutPage() {
  const lang = await getLocale();
  const { title, lede, unesco, video, work, fields, timeline, operators } =
    getPage("about");
  const join = getPage("join");
  const { about: t, home } = getDictionary(lang);
  return (
    <>
      <header className={s.head}>
        <h1 className={s.title}>{title[lang]}</h1>
        <p className={s.lede}>{lede[lang]}</p>
      </header>

      <section className={s.section}>
        <h2 className={s.heading}>{unesco.title[lang]}</h2>
        <div className={s.intro}>
          <div className={s.body}>
            {unesco.body[lang].map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Video id={video.id} title={video.title[lang]} play={t.playVideo} />
        </div>
      </section>

      <section className={`${s.section} ${s.work}`}>
        <h2 className={s.heading}>{work.title[lang]}</h2>
        <ol className={s.cols}>
          {work.items.map((w) => (
            <li key={w.title.vi}>
              <h3 className={s.name}>{w.title[lang]}</h3>
              <p>{w.body[lang]}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.section}>
        <h2 className={s.heading}>{fields.title[lang]}</h2>
        <ul className={`${s.cols} ${s.fields}`}>
          {fields.items.map((f) => (
            <li key={f.vi} className={s.name}>
              {f[lang]}
            </li>
          ))}
        </ul>
        <p className={s.note}>{fields.note[lang]}</p>
      </section>

      <section className={`${s.section} ${s.timeline}`}>
        <h2 className={s.heading}>{timeline.title[lang]}</h2>
        <ol className={s.rows}>
          {timeline.items.map((y) => (
            <li key={y.year}>
              <span className={s.year}>{y.year}</span>
              <p>{y.body[lang]}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.section}>
        <h2 className={s.heading}>{operators.title[lang]}</h2>
        <ul className={`${s.cols} ${s.operators}`}>
          {operators.items.map((o) => (
            <li key={o.vi} className={s.name}>
              {o[lang]}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${s.section} ${s.next}`}>
        <h2 className={s.heading}>{join.title[lang]}</h2>
        <p>{join.lead[lang]}</p>
        <Link href={`/${lang}/join`} className={s.primary}>
          {home.joinNetwork}
          <Arrow />
        </Link>
      </section>
    </>
  );
}
