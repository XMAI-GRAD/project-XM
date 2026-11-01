"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ActionError } from "@/lib/action-result";
import { toggleFavorite } from "./actions";

export function FavoriteButton({
  slug,
  initialFavorited,
  dict,
}: {
  slug: string;
  initialFavorited: boolean;
  dict: Pick<Dictionary, "heritage" | "errors">;
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
    <>
      {/* Disabled while pending, so a double click sends one toggle. */}
      <button
        type="button"
        aria-pressed={shown}
        disabled={pending}
        onClick={toggle}
      >
        <span aria-hidden>{shown ? "★" : "☆"}</span> {dict.heritage.favorite}
      </button>
      <p role="status">{error && dict.errors[error]}</p>
    </>
  );
}
