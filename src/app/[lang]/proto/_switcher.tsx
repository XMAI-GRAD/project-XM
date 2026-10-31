"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const variants = [
  { id: "a", label: "A · Đen vàng" },
  { id: "b", label: "B · Điện ảnh" },
  { id: "c", label: "C · Lưới trắng" },
];

/** Floating bar to compare the three landing prototypes. Throwaway. */
export function ProtoSwitcher() {
  const pathname = usePathname();
  const [, lang, , current] = pathname.split("/");
  const other = lang === "vi" ? "en" : "vi";

  return (
    <nav
      aria-label="Prototype switcher"
      style={{
        position: "fixed",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: "rgb(20 20 20 / 0.92)",
        font: "500 12px/1 system-ui, sans-serif",
        boxShadow: "0 4px 16px rgb(0 0 0 / 0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {variants.map((v) => (
        <Link
          key={v.id}
          href={`/${lang}/proto/${v.id}`}
          aria-current={current === v.id ? "page" : undefined}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            color: current === v.id ? "#141414" : "#f2f2f2",
            background: current === v.id ? "#f2f2f2" : "transparent",
            textDecoration: "none",
          }}
        >
          {v.label}
        </Link>
      ))}
      <Link
        href={pathname.replace(/^\/[^/]+/, `/${other}`)}
        hrefLang={other}
        style={{
          padding: "8px 12px",
          color: "#f2f2f2",
          textDecoration: "none",
          borderLeft: "1px solid #444",
        }}
      >
        {other.toUpperCase()}
      </Link>
    </nav>
  );
}
