import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { HeaderSearch } from "@/components/header-search";
import { SiteFooter } from "@/components/site-footer";
import { getPage, points } from "@/content";
import { AccountStatus, LoginLink } from "@/features/auth/account-status";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";
import s from "./layout.module.css";

/** The frame from the former prototype A: navy side rail, top bar, full-width bands, footer. */
export default async function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const { nav, search, layers: layerNames } = getDictionary(lang);
  const site = getPage("site");
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({ href: `/${lang}/${key}`, label: nav[key] }),
  );

  return (
    <div className={s.shell}>
      <aside className={s.rail}>
        <Link href={`/${lang}`} className={s.logo}>
          {site.brand[lang]}
        </Link>
        <Link href={`/${lang}/explore`} className={s.cta}>
          <span>{nav.explore}</span>
          <svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true">
            <path
              d="M5 0v14M1 10l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </Link>
      </aside>

      <div className={s.content}>
        <header className={s.topbar}>
          <p className={`meta ${s.route}`}>
            <span>{site.brand[lang]}</span>
            <span className={s.sep} aria-hidden="true" />
            <span>{site.designation[lang]}</span>
          </p>
          <nav className={s.nav} aria-label={nav.label}>
            <Link href={`/${lang}`}>{nav.home}</Link>
            {links.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
            <HeaderSearch
              items={points.map((p) => ({
                href: `/${lang}/explore/${p.slug}`,
                name: p.name[lang],
                layer: p.layer,
                layerName: layerNames[p.layer],
              }))}
              label={search.label}
              empty={search.empty}
            />
            <ErrorBoundary fallback={<LoginLink lang={lang} />}>
              <Suspense fallback={<LoginLink lang={lang} />}>
                <AccountStatus lang={lang} />
              </Suspense>
            </ErrorBoundary>
          </nav>
        </header>

        <main className={s.main}>{children}</main>

        <SiteFooter lang={lang} />
      </div>
    </div>
  );
}
