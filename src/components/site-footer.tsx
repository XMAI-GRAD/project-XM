import Link from "next/link";
import { getPage } from "@/content";
import { FooterLogo } from "@/features/home/art";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import s from "./site-footer.module.css";

/**
 * The navy footer (the designer's WEB-07): the logo and the bilingual tagline, then
 * three columns — the site nav, where to visit, how to get in touch — and the credits.
 * Shared by home and the site frame.
 */
export function SiteFooter({ lang }: { lang: Locale }) {
  const { nav, footer } = getDictionary(lang);
  const site = getPage("site");
  const { contact } = site;
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({ href: `/${lang}/${key}`, label: nav[key] }),
  );
  // "Thủ đô Hà Nội — nơi những…" sets as two lines: the name, then "— nơi những…".
  const [name, ...rest] = site.tagline.vi.split(" — ");

  return (
    <footer className={s.footer}>
      <div className={s.grid}>
        <Link
          href={`/${lang}`}
          className={s.logo}
          aria-label={site.brand[lang]}
        >
          <FooterLogo />
        </Link>
        <h2 className={s.title}>{footer.titles.home}</h2>
        <h2 className={s.title}>{footer.titles.visit}</h2>
        <h2 className={s.title}>{footer.titles.contact}</h2>

        <p className={s.tagline}>
          <span lang="vi">
            {name}
            {rest.length > 0 && (
              <>
                <br />— {rest.join(" — ")}
              </>
            )}
          </span>
          <br />
          <span lang="en">{site.tagline.en}</span>
        </p>

        <nav className={s.nav} aria-label={footer.label}>
          <ul>
            {links.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className={s.visit}>
          <p>{site.fullName[lang]}</p>
          {contact.address[lang].map((line) => (
            <p key={line}>{line}</p>
          ))}
          {/* "Thứ Ba – Chủ Nhật, 9h00 – 17h00": days, then times, as in the comp. */}
          <p>
            {contact.hours[lang]
              .flatMap((line) => line.split(", "))
              .map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
          </p>
        </address>

        <address className={s.contact}>
          <p>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
              {contact.phone}
            </a>
            <br />
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </address>

        <p className={s.credits}>{site.credits[lang]}</p>
        <p className={s.madeBy}>{site.madeBy[lang]}</p>
      </div>
    </footer>
  );
}
