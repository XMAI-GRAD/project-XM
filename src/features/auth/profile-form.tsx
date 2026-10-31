"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { updateProfile } from "./actions";

export function ProfileForm({
  displayName,
  dict,
}: {
  displayName: string;
  dict: Pick<Dictionary, "account" | "errors">;
}) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action}>
      <label>
        {dict.account.displayName}
        <input
          name="displayName"
          defaultValue={state?.ok ? state.data.displayName : displayName}
          required
          maxLength={50}
        />
      </label>
      <button type="submit" disabled={pending}>
        {dict.account.save}
      </button>
      <p role="status">
        {state && (state.ok ? dict.account.saved : dict.errors[state.error])}
      </p>
    </form>
  );
}
