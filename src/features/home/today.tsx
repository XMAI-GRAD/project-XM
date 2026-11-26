"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";

const zone = "Asia/Ho_Chi_Minh";

/** "Thứ hai, 16 / 11 / 26": the weekday in words, then dd / mm / yy, in Hanoi time. */
function format(date: Date, lang: Locale) {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang, { timeZone: zone, ...options }).format(date);
  const weekday = part({ weekday: "long" }).toLowerCase();
  const day = part({ day: "2-digit" });
  const month = part({ month: "2-digit" });
  const year = part({ year: "2-digit" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day} / ${month} / ${year}`;
}

const isoDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(date);

const noop = () => () => {};

/**
 * Today's date. The page is prerendered, so the server renders nothing here and the
 * browser fills in the date once it hydrates.
 */
export function Today({ lang }: { lang: Locale }) {
  const now = useSyncExternalStore(
    noop,
    () => {
      const d = new Date();
      return `${isoDay(d)}|${format(d, lang)}`;
    },
    () => null,
  );
  if (!now) return null;
  const [iso, text] = now.split("|");
  return <time dateTime={iso}>{text}</time>;
}
