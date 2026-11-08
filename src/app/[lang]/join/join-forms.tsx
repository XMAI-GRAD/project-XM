"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { Arrow } from "@/components/arrow";
import s from "./page.module.css";

export interface Audience {
  key: string;
  title: string;
  intro: string;
  fields: ReactNode;
}

// Stable identity, so React calls it once on mount rather than on every render.
const focusOnMount = (el: HTMLElement | null) => el?.focus();

// Home block 4 links to /join#individual or /join#organization. The server has no hash.
const onHashChange = (cb: () => void) => {
  addEventListener("hashchange", cb);
  return () => removeEventListener("hashchange", cb);
};
const readHash = () => location.hash.slice(1);
const noHash = () => "";

/**
 * Join (SPEC Part 1): pick Individual or Organization, then fill that one mock form.
 * Both forms stay mounted (the other is `hidden`), so switching keeps what was typed.
 * Submit runs native validation only, sends nothing and shows the "sent" message.
 */
export function JoinForms({
  audiences,
  legend,
  submit,
  sent,
}: {
  audiences: Audience[];
  legend: string;
  submit: ReactNode;
  sent: ReactNode;
}) {
  const hash = useSyncExternalStore(onHashChange, readHash, noHash);
  const [picked, setActive] = useState<string | null>(null);
  const active =
    picked ?? (audiences.some((a) => a.key === hash) ? hash : audiences[0].key);
  const [sentKey, setSentKey] = useState<string | null>(null);
  return (
    <>
      <fieldset className={s.chooser}>
        <legend className={s.srOnly}>{legend}</legend>
        {audiences.map((a) => (
          <label key={a.key} className={s.option} data-audience={a.key}>
            <input
              type="radio"
              name="audience"
              value={a.key}
              checked={active === a.key}
              onChange={() => setActive(a.key)}
            />
            <span className={s.optionTitle}>{a.title}</span>
            <span className={s.optionIntro}>{a.intro}</span>
            <span className={s.optionArrow}>
              <Arrow />
            </span>
          </label>
        ))}
      </fieldset>
      {audiences.map((a) => (
        <div
          key={a.key}
          className={s.panel}
          data-audience={a.key}
          hidden={a.key !== active}
        >
          {sentKey === a.key ? (
            <div
              className={s.sent}
              role="status"
              tabIndex={-1}
              ref={focusOnMount}
            >
              {sent}
            </div>
          ) : (
            <form
              className={s.form}
              aria-label={a.title}
              onSubmit={(e) => {
                e.preventDefault();
                setSentKey(a.key);
              }}
            >
              {a.fields}
              {submit}
            </form>
          )}
        </div>
      ))}
    </>
  );
}
