"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath, type Locale } from "@/i18n/config";

export function LangSwitch({
  to,
  label,
  className,
}: {
  to: Locale;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={localizePath(pathname, to)}
      hrefLang={to}
      lang={to}
      className={className}
    >
      {label}
    </Link>
  );
}
