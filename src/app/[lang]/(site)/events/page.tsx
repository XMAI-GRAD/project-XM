import type { Metadata } from "next";
import { EventList } from "@/components/event-list";
import { getEvents } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/events", getDictionary(lang).events.title);
}

/** Placeholder event gallery (SPEC Part 1, Events). */
export default async function EventsPage() {
  const lang = await getLocale();
  const { events: t, home } = getDictionary(lang);
  return (
    <section className={s.page}>
      <h1 className={s.title}>{t.title}</h1>
      <EventList
        events={getEvents()}
        lang={lang}
        empty={t.empty}
        imageLabel={home.imagePlaceholder}
      />
    </section>
  );
}
