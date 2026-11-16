import Link from "next/link";
import { getPage } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import s from "./site-footer.module.css";

/** The navy footer: nav, contact block and credits. Shared by home and the site frame. */
export function SiteFooter({ lang }: { lang: Locale }) {
  const { nav, footer } = getDictionary(lang);
  const site = getPage("site");
  const { contact } = site;
  const links = (["about", "explore", "maps", "events", "join"] as const).map(
    (key) => ({ href: `/${lang}/${key}`, label: nav[key] }),
  );

  return (
    <footer className={s.footer}>
      <nav className={s.nav} aria-label={footer.label}>
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
  );
}
