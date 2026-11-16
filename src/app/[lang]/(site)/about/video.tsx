"use client";

import Image from "next/image";
import { useState } from "react";
import { crosses } from "@/components/cross";
import s from "./page.module.css";

// Stable identity, so React calls it once on mount: keyboard focus moves to the player.
const focusOnMount = (el: HTMLElement | null) => el?.focus();

/**
 * A YouTube video in a framed figure, behind its thumbnail: nothing loads from YouTube
 * (no player script, no cookies) until the visitor clicks play, and then from
 * youtube-nocookie.com.
 */
export function Video({
  id,
  title,
  play,
}: {
  id: string;
  title: string;
  play: string;
}) {
  const [on, setOn] = useState(false);
  return (
    <div className={s.video}>
      {crosses}
      {on ? (
        <iframe
          ref={focusOnMount}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          aria-label={`${play}: ${title}`}
          onClick={() => setOn(true)}
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 56rem) 50vw, 100vw"
          />
          <span className={s.play}>
            <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
              <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
            </svg>
            {play}
          </span>
        </button>
      )}
    </div>
  );
}
