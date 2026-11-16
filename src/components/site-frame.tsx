"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import s from "@/app/[lang]/layout.module.css";

/** Only the home route uses the new Illustrator frame. Other routes keep their frame. */
export function SiteFrame({
  children,
  rail,
  header,
  footer,
}: {
  children: ReactNode;
  rail: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  if (segment === null) return <main>{children}</main>;
  return (
    <div className={s.shell}>
      {rail}
      <div className={s.content}>
        {header}
        <main className={s.main}>{children}</main>
        {footer}
      </div>
    </div>
  );
}
