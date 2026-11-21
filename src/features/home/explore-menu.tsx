"use client";

import Link from "next/link";
import { useId, useRef, useState, type FocusEvent } from "react";
import type { Layer } from "@/content";
import s from "./home.module.css";

/**
 * Khám phá on the nav tab: not a page of its own but a choice of three. Hovering it,
 * or focusing it, drops ĐỊA · VỊ · NGHỀ below; clicking or tapping the label toggles
 * them. Escape closes the list and returns focus to the label.
 */
export function ExploreMenu({
  label,
  items,
  current,
  currentLayer,
}: {
  label: string;
  items: { layer: Layer; href: string; name: string }[];
  /** On an explore page: the label shows as the current page. */
  current: boolean;
  /** The layer whose page this is, marked in the list. */
  currentLayer?: Layer;
}) {
  const [open, setOpen] = useState(false);
  const list = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const leave = (e: FocusEvent) => {
    if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  return (
    <div
      ref={root}
      className={s.menu}
      data-open={open ? "" : undefined}
      data-current={current ? "" : undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={leave}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        setOpen(false);
        button.current?.focus();
      }}
    >
      <button
        ref={button}
        type="button"
        className={s.navLink}
        aria-expanded={open}
        aria-controls={list}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      <ul id={list} className={s.menuList} hidden={!open}>
        {items.map((item) => (
          <li key={item.layer}>
            <Link
              href={item.href}
              className={s.menuLink}
              data-layer={item.layer}
              aria-current={item.layer === currentLayer ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
