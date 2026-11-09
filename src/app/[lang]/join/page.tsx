import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Arrow } from "@/components/arrow";
import { getPage } from "@/content";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale, pageMetadata } from "@/i18n/server";
import { JoinForms } from "./join-forms";
import s from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return pageMetadata(lang, "/join", getPage("join").title[lang]);
}

function Field({
  label,
  wide,
  children,
}: {
  label: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={wide ? `${s.field} ${s.wide}` : s.field}>
      <span className={s.label}>{label}</span>
      {children}
    </label>
  );
}

function Select({
  name,
  placeholder,
  options,
}: {
  name: string;
  placeholder: string;
  options: Record<string, string>;
}) {
  return (
    <span className={s.select}>
      <select name={name} required defaultValue="">
        <option value="" disabled>
          {placeholder}
        </option>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Join (SPEC Part 1): Individual and Organization mock forms. */
export default async function JoinPage() {
  const lang = await getLocale();
  const { join: t } = getDictionary(lang);
  const page = getPage("join");
  const note = (text: string) => <span className={s.note}>({text})</span>;
  const submit = (
    <button type="submit" className={s.primary}>
      {t.submit}
      <Arrow />
    </button>
  );
  // type="email" accepts "a@b"; the pattern also asks for a dot in the domain.
  const email = (
    <input
      name="email"
      type="email"
      required
      autoComplete="email"
      pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
      title={t.emailHint}
    />
  );
  const audiences = [
    {
      key: "individual" as const,
      fields: (
        <>
          <Field label={t.name}>
            <input name="name" required autoComplete="name" />
          </Field>
          <Field label={t.email}>{email}</Field>
          <Field label={t.field}>
            <Select name="field" placeholder={t.choose} options={t.fields} />
          </Field>
          <Field
            label={
              <>
                {t.portfolio} {note(t.optional)}
              </>
            }
          >
            <input name="portfolio" type="url" autoComplete="url" />
          </Field>
          <Field
            wide
            label={
              <>
                {t.project} {note(t.projectHint)}
              </>
            }
          >
            <textarea name="project" required maxLength={300} rows={5} />
          </Field>
        </>
      ),
    },
    {
      key: "organization" as const,
      fields: (
        <>
          <Field label={t.orgName}>
            <input name="organization" required autoComplete="organization" />
          </Field>
          <Field label={t.contact}>
            <input name="contact" required autoComplete="name" />
          </Field>
          <Field label={t.email} wide>
            {email}
          </Field>
          <Field label={t.field}>
            <Select name="field" placeholder={t.choose} options={t.fields} />
          </Field>
          <Field label={t.size}>
            <Select name="size" placeholder={t.choose} options={t.sizes} />
          </Field>
          <Field label={t.needs} wide>
            <textarea name="needs" required maxLength={500} rows={5} />
          </Field>
        </>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <header className={s.head}>
        <h1 className={s.title}>{page.title[lang]}</h1>
        <p className={s.lead}>{page.lead[lang]}</p>
      </header>
      <JoinForms
        audiences={audiences.map(({ key, fields }) => ({
          key,
          title: page[key].title[lang],
          intro: page[key].intro[lang],
          benefits: page[key].benefits[lang],
          fields,
        }))}
        legend={t.as}
        benefitsLabel={t.benefits}
        submit={submit}
        sent={{ title: t.sentTitle, body: t.sentBody }}
      />
    </div>
  );
}
