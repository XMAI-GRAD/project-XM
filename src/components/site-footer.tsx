import Link from "next/link";
import { getPage } from "@/content";
import { FooterLogo } from "@/features/home/art";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { FooterMotion } from "./footer-motion";
import s from "./site-footer.module.css";

/**
 * The navy footer (docs/svg/01.HOME/03-Footer.svg), a full screen: the logo and the
 * bilingual tagline, then three columns — the site nav, where to visit, how to get in
 * touch — and the credits at the foot. Its rows rise in with the scroll (FooterMotion).
 * Shared by every page.
 */
export function SiteFooter({ lang }: { lang: Locale }) {
  const { nav, footer } = getDictionary(lang);
  const site = getPage("site");
  const { contact } = site;
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({
      href: `/${lang}/${key === "explore" ? "explore/place" : key}`,
      label: nav[key],
    }),
  );
  // "Thủ đô Hà Nội — nơi những…" sets as two lines: the name, then "— nơi những…".
  const [name, ...rest] = site.tagline.vi.split(" — ");

  return (
    <FooterMotion className={s.footer}>
      <div className={s.grid}>
        <Link
          href={`/${lang}`}
          className={s.logo}
          data-footer-row="1"
          aria-label={site.brand[lang]}
        >
          <FooterLogo />
        </Link>
        <h2 className={s.title} data-footer-row="1">
          {footer.titles.home}
        </h2>
        <h2 className={s.title} data-footer-row="1">
          {footer.titles.visit}
        </h2>
        <h2 className={s.title} data-footer-row="1">
          {footer.titles.contact}
        </h2>

        <p className={s.tagline} data-footer-row="2">
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

        <nav className={s.nav} aria-label={footer.label} data-footer-row="2">
          <ul>
            {links.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className={s.visit} data-footer-row="2">
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

        <address className={s.contact} data-footer-row="2">
          <p>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
              {contact.phone}
            </a>
            <br />
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </address>

        <p className={s.credits} data-footer-row="3">
          {site.credits[lang]}
        </p>
        <p className={s.madeBy} data-footer-row="3">
          {site.madeBy[lang]}
        </p>
      </div>
    </FooterMotion>
  );
}
