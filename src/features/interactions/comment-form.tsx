"use client";

import { startTransition, useActionState, useId, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Result } from "@/lib/action-result";
import { addComment } from "./actions";
import { maxCommentLength, parseCommentBody } from "./comment-input";
import s from "./comments.module.css";

const CORNERS = [s.cornerTl, s.cornerTr, s.cornerBr, s.cornerBl] as const;

/** Concave gate-notched corner with lime exterior accent, echoing DetailGate. */
function FrameCorners() {
  return (
    <>
      {CORNERS.map((cornerClass, i) => (
        <svg
          key={i}
          className={`${s.corner} ${cornerClass}`}
          viewBox="0 0 18 18"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 0H8.5A8.5 8.5 0 0 1 0 8.5Z" className={s.cornerAccent} />
          <path
            d="M18 0.5V3.5A14.5 14.5 0 0 1 3.5 18H0.5"
            className={s.cornerStroke}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ))}
    </>
  );
}

/** A new comment, or a reply when `parentId` (a top-level comment's id) is set. */
export function CommentForm({
  slug,
  parentId,
  dict,
  onOptimisticAdd,
  onSuccess,
}: {
  slug: string;
  parentId?: number;
  dict: Pick<Dictionary, "comments" | "errors">;
  onOptimisticAdd?: (body: string, parentId?: number) => void;
  onSuccess?: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const isReply = parentId !== undefined;
  const label = isReply ? dict.comments.replyLabel : dict.comments.label;

  const [state, action, pending] = useActionState(
    async (prev: Result | null, formData: FormData) => {
      const result = await addComment(prev, formData);
      if (result.ok) {
        form.current?.reset();
        onSuccess?.();
      }
      return result;
    },
    null,
  );

  return (
    // onSubmit, not action={…}: React resets an action form even on error, losing the text.
    <form
      ref={form}
      className={isReply ? `${s.form} ${s.formReply}` : s.form}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const body = parseCommentBody(formData.get("body"));
        startTransition(() => {
          if (body !== null) onOptimisticAdd?.(body, parentId);
          action(formData);
        });
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      {isReply && <input type="hidden" name="parentId" value={parentId} />}
      <div className={isReply ? `${s.frame} ${s.frameCompact}` : s.frame}>
        <FrameCorners />
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <textarea
          id={inputId}
          name="body"
          required
          maxLength={maxCommentLength}
          placeholder={label}
          className={s.textarea}
        />
      </div>
      <div className={s.formFooter}>
        <button
          type="submit"
          disabled={pending}
          className={isReply ? `${s.submit} ${s.submitReply}` : s.submit}
        >
          {dict.comments.submit} <span aria-hidden="true">→</span>
        </button>
        <p role="status" className={s.status}>
          {state && !state.ok && dict.errors[state.error]}
        </p>
      </div>
    </form>
  );
}
