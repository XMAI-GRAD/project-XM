import { OpeningPetal, OpeningWordmark } from "./art";
import s from "./home.module.css";

/**
 * The opening slide (WEB-01): the wordmark on navy. It stays at the top of the page;
 * the scroll into the page below is where the transition will play. Decorative: the
 * brand is named again by the header logo.
 */
export function Opening() {
  return (
    <div className={s.opening} aria-hidden="true">
      <OpeningWordmark className={s.wordmark} />
      <OpeningPetal className={s.openingPetal} />
    </div>
  );
}
