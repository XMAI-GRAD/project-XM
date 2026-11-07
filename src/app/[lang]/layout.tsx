import type { Metadata } from "next";
import { Inter, Phudu } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { LangSwitch } from "@/components/lang-switch";
import { getPage } from "@/content";
import { AccountStatus, LoginLink } from "@/features/auth/account-status";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, siteUrl } from "@/i18n/server";
import s from "./layout.module.css";
import "../globals.css";

const display = Phudu({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});
const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getDictionary(await getLocale());
  return {
    metadataBase: new URL(siteUrl),
    title: { default: meta.siteName, template: `%s | ${meta.siteName}` },
    description: meta.description,
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** The frame from the former prototype A: navy side rail, top bar, full-width bands, footer. */
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  const { nav, footer } = getDictionary(lang);
  const site = getPage("site");
  const other = locales.find((l) => l !== lang)!;
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({ href: `/${lang}/${key}`, label: nav[key] }),
  );
  const { contact } = site;

  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body>
        <div className={s.shell}>
          <aside className={s.rail}>
            <Link href={`/${lang}`} className={s.logo}>
              {site.brand[lang]}
            </Link>
            <Link href={`/${lang}/explore`} className={s.cta}>
              <span>{nav.explore}</span>
              <svg
                viewBox="0 0 10 16"
                width="10"
                height="16"
                aria-hidden="true"
              >
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
                <ErrorBoundary fallback={<LoginLink lang={lang} />}>
                  <Suspense fallback={<LoginLink lang={lang} />}>
                    <AccountStatus lang={lang} />
                  </Suspense>
                </ErrorBoundary>
                <LangSwitch
                  to={other}
                  label={nav.switchLanguage}
                  className={s.lang}
                />
              </nav>
            </header>

            <main className={s.main}>{children}</main>

            <footer className={s.footer}>
              <nav className={s.footNav} aria-label={footer.label}>
                {links.map((n) => (
                  <Link key={n.href} href={n.href}>
                    {n.label}
                  </Link>
                ))}
              </nav>
              <address className={s.contact}>
                <p>
                  <strong>{site.fullName[lang]}</strong>
                  {contact.address[lang].map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
                <p>
                  <span className="meta">{footer.hours}</span>
                  {contact.hours[lang].map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
                <p>
                  <span className="meta">{footer.phone}</span>
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                    {contact.phone}
                  </a>
                  <span className="meta">{footer.email}</span>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              </address>
              <p className="meta">{site.credits[lang]}</p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
