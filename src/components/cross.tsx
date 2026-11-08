import s from "./cross.module.css";

/** Corner-cross mark for a framed figure. Color: `--cross` on an ancestor, navy by default. */
function Cross({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg className={`${s.cross} ${s[pos]}`} viewBox="0 0 11 11" aria-hidden>
      <path
        d="M5.5 0v11M0 5.5h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

/** All four corner crosses. The parent must be `position: relative` and not clip overflow. */
export const crosses = (["tl", "tr", "bl", "br"] as const).map((p) => (
  <Cross key={p} pos={p} />
));
