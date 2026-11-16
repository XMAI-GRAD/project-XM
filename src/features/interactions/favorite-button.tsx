"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ActionError } from "@/lib/action-result";
import { toggleFavorite } from "./actions";
import s from "./favorite-button.module.css";

export function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 22" width="24" height="22" aria-hidden="true">
      <path
        d="M12 20.5S2 14.4 2 7.4A5 5 0 0 1 12 5a5 5 0 0 1 10 2.4c0 7-10 13.1-10 13.1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteButton({
  slug,
  initialFavorited,
  dict,
}: {
  slug: string;
  initialFavorited: boolean;
  dict: Pick<Dictionary, "point" | "errors">;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [shown, setShown] = useOptimistic(favorited);
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setError(null);
      setShown(!favorited);
      const result = await toggleFavorite(slug);
      startTransition(() => {
        if (result.ok) setFavorited(result.data.favorited);
        else setError(result.error);
      });
    });

  return (
    <div className={s.wrap}>
      {/* Disabled while pending, so a double click sends one toggle. */}
      <button
        type="button"
        aria-pressed={shown}
        aria-label={dict.point.favorite}
        disabled={pending}
        onClick={toggle}
        className={s.button}
      >
        <Heart filled={shown} />
      </button>
      <p role="status" className={s.status}>
        {error && dict.errors[error]}
      </p>
    </div>
  );
}
