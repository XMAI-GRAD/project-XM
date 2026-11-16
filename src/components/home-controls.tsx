"use client";

import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";
import s from "@/app/[lang]/page.module.css";

const subscribeToClock = (notify: () => void) => {
  const timer = window.setInterval(notify, 60_000);
  return () => window.clearInterval(timer);
};
const hanoiDay = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const serverDay = () => "";

export function HanoiDate({
  lang,
  placeholder,
}: {
  lang: Locale;
  placeholder: string;
}) {
  const day = useSyncExternalStore(subscribeToClock, hanoiDay, serverDay);
  if (!day) return <span>{placeholder}</span>;
  const date = new Date(`${day}T12:00:00+07:00`);
  const weekday = new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
  }).format(date);
  const numbers = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
    .format(date)
    .replaceAll("/", " / ");
  return (
    <time dateTime={day}>
      {weekday}, {numbers}
    </time>
  );
}

/** Native dialog supplies modal focus containment, Escape and focus restoration. */
export function HomeMenu({
  mark,
  children,
  openLabel,
  closeLabel,
  title,
}: {
  mark: ReactNode;
  children: ReactNode;
  openLabel: string;
  closeLabel: string;
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={s.menuButton}
        aria-label={openLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        {mark}
      </button>
      <dialog
        ref={dialog}
        id={id}
        className={s.menuDialog}
        aria-label={title}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button:not([disabled])",
            ),
          ].filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          // Keep the cycle within the menu, including browsers that otherwise
          // move from a native dialog's last control into their browser chrome.
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={s.menuInner}>
          <button type="button" className={s.closeMenu} onClick={close}>
            {closeLabel} <span aria-hidden="true">×</span>
          </button>
          <div
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) close();
            }}
          >
            {children}
          </div>
        </div>
      </dialog>
    </>
  );
}
