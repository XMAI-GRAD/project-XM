"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import s from "./palette.module.css";

const variants = ["a", "b", "c"] as const;

/** Floating bar to compare the three landing prototypes. Throwaway. */
export function ProtoSwitcher() {
  const pathname = usePathname();
  const [, lang, , current] = pathname.split("/");
  if (!hasLocale(lang)) return null;
  const other = lang === "vi" ? "en" : "vi";
  const { prototypes } = getDictionary(lang);

  return (
    <nav aria-label={prototypes.switcher} className={s.switcher}>
      {variants.map((v) => (
        <Link
          key={v}
          href={`/${lang}/proto/${v}`}
          aria-current={current === v ? "page" : undefined}
        >
          {prototypes[v]}
        </Link>
      ))}
      <Link
        href={pathname.replace(/^\/[^/]+/, `/${other}`)}
        hrefLang={other}
        lang={other}
        className={s.language}
      >
        {other.toUpperCase()}
      </Link>
    </nav>
  );
}
