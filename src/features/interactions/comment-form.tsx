"use client";

import { startTransition, useActionState, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Result } from "@/lib/action-result";
import { addComment } from "./actions";
import { maxCommentLength } from "./comment-input";

export function CommentForm({
  slug,
  dict,
}: {
  slug: string;
  dict: Pick<Dictionary, "comments" | "errors">;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: Result | null, formData: FormData) => {
      const result = await addComment(prev, formData);
      if (result.ok) form.current?.reset();
      return result;
    },
    null,
  );
  return (
    // onSubmit, not action={…}: React resets an action form even on error, losing the text.
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <label>
        {dict.comments.label}
        <textarea name="body" required maxLength={maxCommentLength} />
      </label>
      <button type="submit" disabled={pending}>
        {dict.comments.submit}
      </button>
      <p role="status">{state && !state.ok && dict.errors[state.error]}</p>
    </form>
  );
}
