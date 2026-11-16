import Link from "next/link";
import type { Point } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import s from "./point-row.module.css";

/** A row that opens to a short description and a link to the point page. Sharing `name` keeps one row open at a time. */
export function PointRow({ point: p, lang }: { point: Point; lang: Locale }) {
  const { explore: t } = getDictionary(lang);
  return (
    <li className={s.item}>
      <details name="explore-row" className={s.details}>
        <summary className={s.summary}>
          <h2 className={s.name}>{p.name[lang]}</h2>
          <span className={`meta ${s.where}`}>{p.kind[lang]}</span>
          <span className={s.toggle} aria-hidden="true">
            <span className={s.bar} data-bar />
          </span>
        </summary>
        <div className={s.reveal} data-reveal>
          <div className={s.body}>
            <p className={s.text}>{p.story[lang][0]}</p>
            <Link
              href={`/${lang}/explore/${p.slug}`}
              className={s.primary}
              aria-label={`${t.viewDetail}: ${p.name[lang]}`}
            >
              {t.viewDetail}
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
            </Link>
          </div>
        </div>
      </details>
    </li>
  );
}
