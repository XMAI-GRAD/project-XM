"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { Arrow } from "@/components/arrow";
import s from "./page.module.css";

export interface Audience {
  key: string;
  title: string;
  intro: string;
  benefits: string[];
  fields: ReactNode;
}

interface Sent {
  key: string;
  name: string;
  email: string;
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M2.5 8.5l3.5 3.5 7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
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
 * Submit runs native validation only, sends nothing and shows the "sent" message, which
 * names the person and the email the next steps go to.
 */
export function JoinForms({
  audiences,
  legend,
  benefitsLabel,
  submit,
  sent,
}: {
  audiences: Audience[];
  legend: string;
  benefitsLabel: string;
  submit: ReactNode;
  /** Copy with {name} and {email} placeholders. */
  sent: { title: string; body: string };
}) {
  const hash = useSyncExternalStore(onHashChange, readHash, noHash);
  const [picked, setActive] = useState<string | null>(null);
  const active =
    picked ?? (audiences.some((a) => a.key === hash) ? hash : audiences[0].key);
  const [done, setDone] = useState<Sent | null>(null);
  return (
    <>
      <fieldset className={s.chooser}>
        <legend className={s.srOnly}>{legend}</legend>
        {audiences.map((a) => (
          <div key={a.key} className={s.option} data-audience={a.key}>
            <label>
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
            {/* Outside the label, so the radio's name stays short. */}
            {active === a.key && (
              <div className={s.benefits}>
                <p className={s.benefitsLabel}>{benefitsLabel}</p>
                <ul>
                  {a.benefits.map((b) => (
                    <li key={b}>
                      <Check />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </fieldset>
      {audiences.map((a) => (
        <div
          key={a.key}
          className={s.panel}
          data-audience={a.key}
          hidden={a.key !== active}
        >
          {done?.key === a.key ? (
            <div
              className={s.sent}
              role="status"
              tabIndex={-1}
              ref={focusOnMount}
            >
              <span className={s.sentMark} aria-hidden="true">
                <Check />
              </span>
              <p className={s.sentTitle}>{sent.title}</p>
              <p className={s.sentBody}>
                {sent.body
                  .split(/(\{name\}|\{email\})/)
                  .map((part, i) =>
                    part === "{name}" ? (
                      <strong key={i}>{done.name}</strong>
                    ) : part === "{email}" ? (
                      <strong key={i}>{done.email}</strong>
                    ) : (
                      part
                    ),
                  )}
              </p>
            </div>
          ) : (
            <form
              className={s.form}
              aria-label={a.title}
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setDone({
                  key: a.key,
                  name: String(data.get("name") ?? data.get("contact")),
                  email: String(data.get("email")),
                });
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
