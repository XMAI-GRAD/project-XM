"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { updateProfile } from "@/features/auth/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import s from "./page.module.css";

// Stable identity, so React calls it once on mount rather than on every render.
const selectOnMount = (el: HTMLInputElement | null) => el?.select();

/** The display name as the page heading, edited in place. */
export function ProfileForm({
  displayName,
  dict,
}: {
  displayName: string;
  dict: Pick<Dictionary, "account" | "errors">;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    async (
      prev: Awaited<ReturnType<typeof updateProfile>> | null,
      formData: FormData,
    ) => {
      const result = await updateProfile(prev, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    null,
  );
  const name = state?.ok ? state.data.displayName : displayName;
  const formId = useId();

  // Back to the edit button when the field closes, so keyboard focus isn't lost.
  const editButton = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (editing) opened.current = true;
    else if (opened.current) editButton.current?.focus();
  }, [editing]);

  const message =
    state &&
    (state.ok
      ? !editing && dict.account.saved
      : editing && dict.errors[state.error]);

  return (
    <div className={s.identity}>
      <h1 className={editing ? s.srOnly : s.displayName}>
        {name || dict.account.noName}
      </h1>
      {editing && (
        <form id={formId} action={action} className={s.nameForm}>
          <label htmlFor={`${formId}-name`} className="meta">
            {dict.account.displayName}
          </label>
          <input
            ref={selectOnMount}
            id={`${formId}-name`}
            name="displayName"
            defaultValue={name}
            required
            maxLength={50}
            autoComplete="nickname"
            aria-describedby={`${formId}-hint`}
            className={s.nameInput}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          />
          <p id={`${formId}-hint`} className={s.hint}>
            {dict.account.nameHint}
          </p>
        </form>
      )}
      <div className={s.nameRow}>
        {editing ? (
          <>
            <button
              type="submit"
              form={formId}
              disabled={pending}
              className={s.primary}
            >
              {dict.account.save}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={s.pill}
            >
              {dict.account.cancel}
            </button>
          </>
        ) : (
          <button
            ref={editButton}
            type="button"
            onClick={() => setEditing(true)}
            className={s.pill}
          >
            {dict.account.editName}
          </button>
        )}
        <p role="status" className={s.status}>
          {message}
        </p>
      </div>
    </div>
  );
}
