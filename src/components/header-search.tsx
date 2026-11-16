"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Layer } from "@/content";
import s from "./header-search.module.css";
import { search } from "./search";

export interface SearchItem {
  href: string;
  name: string;
  layer: Layer;
  layerName: string;
}

/**
 * Header search: point names in the current language, ignoring case and diacritics
 * (SPEC Part 1, Explore behavior). The results are plain links: Tab or the arrow keys
 * move through them, Escape clears the field.
 */
export function HeaderSearch({
  items,
  label,
  empty,
}: {
  items: SearchItem[];
  label: string;
  empty: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = search(items, query);
  const shown = open && query.trim() !== "";

  const links = () => [...(box.current?.querySelectorAll("a") ?? [])];
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      input.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const all = links();
      const at = all.indexOf(document.activeElement as HTMLAnchorElement);
      const next = at + (e.key === "ArrowDown" ? 1 : -1);
      e.preventDefault();
      if (next < 0) input.current?.focus();
      else all[Math.min(next, all.length - 1)]?.focus();
    }
  };

  return (
    <div
      ref={box}
      role="search"
      className={s.search}
      onKeyDown={onKeyDown}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle
          cx="6.5"
          cy="6.5"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="m10.5 10.5 4 4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <input
        ref={input}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={label}
        aria-label={label}
        aria-controls={listId}
        autoComplete="off"
        spellCheck={false}
      />
      <div id={listId} className={s.panel} hidden={!shown}>
        {results.length > 0 ? (
          <ul>
            {results.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className={s.layer} data-layer={r.layer}>
                    {r.layerName}
                  </span>
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">{empty}</p>
        )}
      </div>
    </div>
  );
}
