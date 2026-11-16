"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Arrow } from "@/components/arrow";
import { crosses } from "@/components/cross";
import type { Layer } from "@/content";
import { toggleFavorite } from "@/features/interactions/actions";
import { Heart } from "@/features/interactions/favorite-button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ActionError } from "@/lib/action-result";
import s from "./page.module.css";

export interface SavedPoint {
  slug: string;
  code: string;
  layer: Layer;
  name: string;
  address: string;
  cover?: string;
}

type Dict = Pick<Dictionary, "account" | "errors" | "layers"> & {
  imagePlaceholder: string;
  explore: string;
};

/**
 * The saved points as framed figures. The list is kept from the first render: a removal
 * refreshes the page without that point, but its card stays, faded, with "Save again",
 * until the page is reloaded.
 */
export function SavedWall({
  points,
  total,
  lang,
  dict,
}: {
  points: SavedPoint[];
  total: number;
  lang: Locale;
  dict: Dict;
}) {
  const [items] = useState(points);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const count = items.length - removed.size;

  const setRemovedOne = (slug: string, isRemoved: boolean) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      if (isRemoved) next.add(slug);
      else next.delete(slug);
      return next;
    });

  return (
    <section className={s.saved} aria-labelledby="saved-heading">
      <div className={s.savedHead}>
        <h2 id="saved-heading" className={s.heading}>
          {dict.account.favorites}
        </h2>
        <p className={s.count}>
          {dict.account.savedCount
            .replace("{n}", String(count))
            .replace("{total}", String(total))}
        </p>
      </div>
      {items.length > 0 ? (
        <ul className={s.wall}>
          {items.map((p) => (
            <Card
              key={p.slug}
              point={p}
              lang={lang}
              dict={dict}
              removed={removed.has(p.slug)}
              onToggled={(isRemoved) => setRemovedOne(p.slug, isRemoved)}
            />
          ))}
        </ul>
      ) : (
        <div className={s.empty}>
          {crosses}
          <p className={s.emptyTitle}>{dict.account.noFavorites}</p>
          <p className={s.emptyHint}>{dict.account.noFavoritesHint}</p>
          <Link href={`/${lang}/explore`} className={s.primary}>
            {dict.explore}
            <Arrow />
          </Link>
        </div>
      )}
    </section>
  );
}

function Card({
  point,
  lang,
  dict,
  removed,
  onToggled,
}: {
  point: SavedPoint;
  lang: Locale;
  dict: Dict;
  removed: boolean;
  onToggled: (removed: boolean) => void;
}) {
  const [shown, setShown] = useOptimistic(removed);
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();

  // toggleFavorite flips whatever the DB holds, so its answer, not this card, is the truth.
  const toggle = () =>
    startTransition(async () => {
      setError(null);
      setShown(!removed);
      const result = await toggleFavorite(point.slug);
      startTransition(() => {
        if (result.ok) onToggled(!result.data.favorited);
        else setError(result.error);
      });
    });

  return (
    <li
      className={s.card}
      data-layer={point.layer}
      data-removed={shown || undefined}
    >
      {crosses}
      <p className={`meta ${s.cap}`}>
        <span>{point.code.toUpperCase()}</span>
        <span>{dict.layers[point.layer]}</span>
      </p>
      <div className={s.figure}>
        {point.cover ? (
          <Image
            src={point.cover}
            alt=""
            fill
            sizes="(max-width: 48rem) 100vw, 30vw"
          />
        ) : (
          <span className={s.chip}>{dict.imagePlaceholder}</span>
        )}
      </div>
      <h3 className={s.name}>
        <Link href={`/${lang}/explore/${point.slug}`} className={s.link}>
          {point.name}
        </Link>
      </h3>
      <div className={s.foot}>
        <p className={s.address}>{point.address}</p>
        {/* Disabled while pending, so a double click sends one toggle. */}
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          className={s.unsave}
        >
          <Heart filled={!shown} />
          {shown ? dict.account.resave : dict.account.unsave}
          <span className={s.srOnly}> {point.name}</span>
        </button>
      </div>
      <p role="status" className={s.status}>
        {error ? dict.errors[error] : shown && dict.account.removed}
      </p>
    </li>
  );
}
