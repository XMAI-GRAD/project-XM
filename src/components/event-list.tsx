import Image from "next/image";
import { Fragment } from "react";
import type { EventCard } from "@/content";
import type { Locale } from "@/i18n/config";
import { crosses } from "./cross";
import { eventDates } from "./event-dates";
import s from "./event-list.module.css";

/** Event cards (SPEC Part 1, Events): framed image · date · title · place. Not links. */
export function EventList({
  events,
  lang,
  empty,
  imageLabel,
  heading: H = "h2",
}: {
  events: EventCard[];
  lang: Locale;
  empty: string;
  /** Chip shown in the frame while an event has no photo yet. */
  imageLabel: string;
  heading?: "h2" | "h3";
}) {
  if (!events.length) return <p className={s.empty}>{empty}</p>;
  return (
    <ul className={s.grid}>
      {events.map((e) => (
        <li key={`${e.date}-${e.title.vi}`} className={s.card}>
          <span className={s.figure} aria-hidden={!e.image}>
            {crosses}
            {e.image ? (
              <Image
                src={e.image.src}
                alt={e.image.alt[lang]}
                fill
                sizes="(min-width: 56rem) 33vw, 100vw"
              />
            ) : (
              <span className={s.label}>{imageLabel}</span>
            )}
          </span>
          <p className={s.date}>
            {eventDates(e.date, e.endDate).map((d, i) => (
              <Fragment key={d.iso}>
                {i > 0 && " – "}
                <time dateTime={d.iso}>{d.label}</time>
              </Fragment>
            ))}
          </p>
          <H className={s.title}>{e.title[lang]}</H>
          <p className={s.place}>{e.place[lang]}</p>
        </li>
      ))}
    </ul>
  );
}
