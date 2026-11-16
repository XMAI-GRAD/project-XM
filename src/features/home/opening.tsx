import { HomeSectionLink } from "./section-link";
import { OpeningPetal, OpeningWordmark } from "./art";
import s from "./home.module.css";
import { getPage } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * The opening slide (WEB-01): the wordmark on navy. It stays at the top of the page;
 * the original extracted wordmark supplies both the static art and the scroll morph.
 */
export function Opening({ lang }: { lang: Locale }) {
  const { home } = getDictionary(lang);
  return (
    <section
      className={s.opening}
      aria-label={getPage("site").brand[lang]}
      data-opening
      data-home-design="web-01"
    >
      <div className={s.wordmark} data-opening-origin>
        <HomeSectionLink
          href={`/${lang}#home-entry-${lang}`}
          data-opening-logo
          aria-label={home.enterHomepage}
        >
          <OpeningWordmark />
        </HomeSectionLink>
      </div>
      <div
        className={s.openingArtwork}
        data-opening-backdrop
        aria-hidden="true"
      >
        <OpeningPetal className={s.openingPetal} />
      </div>
    </section>
  );
}
