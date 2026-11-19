import { getPage, getPoints, type Layer } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ExplorePlaceLine, explorePlaceLineBox } from "@/features/home/art";
import h from "@/features/home/home.module.css";
import { at } from "@/features/home/place";
import s from "./explore.module.css";
import { PointCard } from "./point-card";

/**
 * One layer's slide on explore (ĐỊA.svg, 1920 × 1436): its name, the line to its caption,
 * and its points as gates. ĐỊA is designed; VỊ and NGHỀ follow when their comps do.
 */
export function LayerSlide({ layer, lang }: { layer: Layer; lang: Locale }) {
  const { layers: names } = getDictionary(lang);
  const { layers: captions } = getPage("home");
  return (
    <section
      className={`${h.section} ${s.slide}`}
      data-layer={layer}
      aria-labelledby={`layer-${layer}`}
    >
      <h2
        id={`layer-${layer}`}
        className={`${h.at} ${h.text} ${h.display} ${s.layerName}`}
      >
        {names[layer]}
      </h2>
      <ExplorePlaceLine
        className={h.at}
        style={at({ ...explorePlaceLineBox, y: 405.84 })}
      />
      <p className={`${h.at} ${h.text} ${s.caption}`}>
        {captions[layer][lang]}
      </p>
      <ul className={s.points}>
        {getPoints(layer).map((point) => (
          <li key={point.slug} className={h.at}>
            <PointCard point={point} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
