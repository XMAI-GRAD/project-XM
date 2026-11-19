import { getImageProps } from "next/image";
import Link from "next/link";
import type { Point } from "@/content";
import type { Locale } from "@/i18n/config";
import { DetailGate, detailGateBox } from "./art";
import s from "./explore.module.css";

/** The lime border the gate leaves around a photo, in comp units. */
const BORDER = 10;

/**
 * A point on the explore slide and point detail page: its cover cut to the lime
 * gate, a lime border showing round it, and its name below. Without a real photo
 * (none yet, or only a temporary stand-in) the gate stays lime.
 * The whole card links to the point.
 */
export function PointCard({ point, lang }: { point: Point; lang: Locale }) {
  const { w, h } = detailGateBox;
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
    <Link
      href={`/${lang}/explore/${point.slug}`}
      className={s.card}
      data-gate-link=""
      data-gate-slug={point.slug}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={s.gate}
        aria-hidden="true"
        focusable="false"
        data-gate-svg=""
      >
        {photo && (
          <defs>
            {/* The gate again, inset, as the photo's cut: alpha, so it's opaque. */}
            <mask id={mask} style={{ maskType: "alpha" }}>
              <DetailGate
                x={BORDER}
                y={BORDER}
                width={w - 2 * BORDER}
                height={h - 2 * BORDER}
                preserveAspectRatio="none"
                data-gate-mask=""
              />
            </mask>
          </defs>
        )}
        <DetailGate width={w} height={h} data-gate-frame="" />
        {photo && (
          <g mask={`url(#${mask})`}>
            <image
              href={photo}
              width={w}
              height={h}
              preserveAspectRatio="xMidYMid slice"
              data-gate-photo=""
              data-gate-nw={cover?.width}
              data-gate-nh={cover?.height}
            />
          </g>
        )}
      </svg>
      <span className={s.name} data-gate-name="">
        {point.name[lang]}
      </span>
    </Link>
  );
}
