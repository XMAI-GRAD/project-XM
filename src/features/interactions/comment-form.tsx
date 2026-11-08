"use client";

import { startTransition, useActionState, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Result } from "@/lib/action-result";
import { addComment } from "./actions";
import { maxCommentLength } from "./comment-input";
import s from "./comments.module.css";

/** A new comment, or a reply when `parentId` (a top-level comment's id) is set. */
export function CommentForm({
  slug,
  parentId,
  dict,
}: {
  slug: string;
  parentId?: number;
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
      className={s.form}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      {parentId !== undefined && (
        <input type="hidden" name="parentId" value={parentId} />
      )}
      <label className={`meta ${s.field}`}>
        {parentId === undefined
          ? dict.comments.label
          : dict.comments.replyLabel}
        <textarea name="body" required maxLength={maxCommentLength} />
      </label>
      <button type="submit" disabled={pending} className={s.submit}>
        {dict.comments.submit}
      </button>
      <p role="status" className={s.status}>
        {state && !state.ok && dict.errors[state.error]}
      </p>
    </form>
  );
}
