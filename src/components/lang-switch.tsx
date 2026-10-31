"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath, type Locale } from "@/i18n/config";

export function LangSwitch({ to, label }: { to: Locale; label: string }) {
  const pathname = usePathname();
  return (
    <Link href={localizePath(pathname, to)} hrefLang={to} lang={to}>
      {label}
    </Link>
  );
}
