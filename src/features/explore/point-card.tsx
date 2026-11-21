import { getImageProps } from "next/image";
import Link from "next/link";
import { detailPhoto, type Point } from "@/content";
import type { Locale } from "@/i18n/config";
import { DetailGate, detailGateBox } from "./art";
import s from "./explore.module.css";

/** The lime border the gate leaves around a photo, in comp units. */
const BORDER = 10;
/** Matches the hero `<Image>` sizes in `src/app/[lang]/explore/[slug]/page.tsx`. */
const HERO_SIZES = "(max-width: 48rem) 100vw, 50vw";

/**
 * A point on the explore slide and point detail page: its cover cut to the lime
 * gate, a lime border showing round it, and its name below. Without a real photo
 * (none yet, or only a temporary stand-in) the gate stays lime.
 * The whole card links to the point.
 */
export function PointCard({ point, lang }: { point: Point; lang: Locale }) {
  const { w, h } = detailGateBox;
  // Use the same photo as the point detail hero (`detailPhoto` falls back to the
  // first non-temporary cover) so the gate's center slice always matches frame 0
  // of the detail hero FLIP with zero crop or cache divergence.
  const hero = detailPhoto(point.images);
  const photo = hero
    ? getImageProps({
        src: hero.src,
        width: 720,
        height: Math.round((720 * hero.height) / hero.width),
        alt: "",
      }).props.src
    : null;
  const heroImage = hero
    ? getImageProps({
        src: hero.src,
        fill: true,
        sizes: HERO_SIZES,
        alt: "",
      }).props
    : null;
  const mask = `gate-${point.slug}`;

  return (
    <Link
      href={`/${lang}/explore/${point.slug}`}
      prefetch={true}
      className={s.card}
      data-gate-link=""
      data-gate-slug={point.slug}
      data-gate-hero-src={heroImage?.src}
      data-gate-hero-srcset={heroImage?.srcSet}
      data-gate-hero-sizes={heroImage?.sizes}
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
              data-gate-nw={hero?.width}
              data-gate-nh={hero?.height}
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
