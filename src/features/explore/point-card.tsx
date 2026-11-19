import { getImageProps } from "next/image";
import Link from "next/link";
import type { Point } from "@/content";
import type { Locale } from "@/i18n/config";
import {
  ExploreGate,
  exploreGateBox,
  type ArtBox,
  type ArtComponent,
} from "@/features/home/art";
import s from "./explore.module.css";

/** The lime border the gate leaves around a photo, in comp units. */
const DEFAULT_GATE = {
  Art: ExploreGate,
  box: exploreGateBox,
  border: 5,
};

/**
 * A point on the explore slide (WEB-06): its cover cut to the lime gate, a lime
 * border showing round it, and its name below. Without a real photo (none yet, or
 * only a temporary stand-in) the gate stays lime.
 * The whole card links to the point.
 */
export function PointCard({
  point,
  lang,
  gate = DEFAULT_GATE,
}: {
  point: Point;
  lang: Locale;
  gate?: { Art: ArtComponent; box: ArtBox; border: number };
}) {
  const {
    Art: Gate,
    box: { w, h },
    border,
  } = gate;
  // A temporary stand-in isn't shown here: the gate stays lime until the real photo.
  const cover = point.images.find((image) => !image.temporary);
  const photo = cover
    ? getImageProps({
        src: cover.src,
        width: 720,
        height: Math.round((720 * cover.height) / cover.width),
        alt: "",
      }).props.src
    : null;
  const mask = `gate-${point.slug}`;

  return (
    <Link href={`/${lang}/explore/${point.slug}`} className={s.card}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={s.gate}
        aria-hidden="true"
        focusable="false"
      >
        {photo && (
          <defs>
            {/* The gate again, inset, as the photo's cut: alpha, so it's opaque. */}
            <mask id={mask} style={{ maskType: "alpha" }}>
              <Gate
                x={border}
                y={border}
                width={w - 2 * border}
                height={h - 2 * border}
                preserveAspectRatio="none"
              />
            </mask>
          </defs>
        )}
        <Gate width={w} height={h} />
        {photo && (
          <image
            href={photo}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
            mask={`url(#${mask})`}
          />
        )}
      </svg>
      <span className={s.name}>{point.name[lang]}</span>
    </Link>
  );
}
