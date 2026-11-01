"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { ActionError } from "@/lib/action-result";
import { deleteComment } from "./actions";

export function DeleteCommentButton({
  id,
  dict,
}: {
  id: number;
  dict: Pick<Dictionary, "comments" | "errors">;
}) {
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteComment(id);
            startTransition(() => setError(result.ok ? null : result.error));
          })
        }
      >
        {dict.comments.delete}
      </button>
      {error && <span role="status">{dict.errors[error]}</span>}
    </>
  );
}
