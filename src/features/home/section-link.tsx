"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

// Only explicit cross-page anchor navigation requests this handoff. Back/Forward
// restores its own scroll position and must not be treated as a new header entry.
let pendingEntry: string | undefined;

export function takeHomeEntry(id: string) {
  if (pendingEntry !== id) return false;
  pendingEntry = undefined;
  return true;
}

/** Preserve Next's history state and native anchor-style keyboard focus. */
export function HomeSectionLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string;
}) {
  return (
    <Link
      {...props}
      href={href}
      onNavigate={() => {
        const targetId = href.split("#")[1];
        if (targetId) {
          if (window.location.pathname !== href.split("#")[0])
            pendingEntry = targetId;
          document.getElementById(targetId)?.focus({ preventScroll: true });
        }
      }}
    />
  );
}
