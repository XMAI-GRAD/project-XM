"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

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
          document.getElementById(targetId)?.focus({ preventScroll: true });
        }
      }}
    />
  );
}
