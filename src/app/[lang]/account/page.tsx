import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { crosses } from "@/components/cross";
import { getPoint, points } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyFavoriteSlugs } from "@/features/interactions/queries";
import s from "./page.module.css";
import { ProfileForm } from "./profile-form";
import { SavedWall } from "./saved-wall";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return {
    title: getDictionary(lang).account.title,
    robots: { index: false },
  };
}

/** Profile (SPEC Part 1): an identity strip over a wall of framed saved points. */
export default async function AccountPage() {
  const lang = await getLocale();
  return (
    <div className={s.page}>
      {/* Holds the wall's place too, so the footer doesn't jump when it streams in. */}
      <Suspense
        fallback={
          <div aria-busy="true">
            <div className={s.strip}>
              <span className={s.avatar} />
              <span className={s.bar} />
            </div>
            <div className={s.saved}>
              <div className={s.savedHead}>
                <h2 className={s.heading}>
                  {getDictionary(lang).account.favorites}
                </h2>
              </div>
              <ul className={s.wall}>
                {[0, 1, 2].map((i) => (
                  <li key={i} className={s.card}>
                    {crosses}
                    <span className={s.figure} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      >
        <Profile lang={lang} />
      </Suspense>
    </div>
  );
}

async function Profile({ lang }: { lang: Locale }) {
  const user = await getCurrentUser();
  if (!user)
    redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/account`)}`);
  const { account, errors, layers, home, nav } = getDictionary(lang);
  // Skips slugs whose point was removed from the content.
  const saved = (await getMyFavoriteSlugs()).flatMap((slug) => {
    const p = getPoint(slug);
    if (!p) return [];
    return {
      slug: p.slug,
      code: p.code,
      layer: p.layer,
      name: p.name[lang],
      address: p.address,
      cover: p.images[0]?.src,
    };
  });
  const initial = [...user.displayName.trim()][0]?.toUpperCase();

  return (
    <>
      <section className={s.strip}>
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={112}
            height={112}
            className={s.avatar}
          />
        ) : (
          <span className={s.avatar} aria-hidden="true">
            {initial}
          </span>
        )}
        <ProfileForm
          displayName={user.displayName}
          dict={{ account, errors }}
        />
        <form action={signOut} className={s.signOut}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className={s.pill}>
            {account.signOut}
          </button>
        </form>
      </section>
      <SavedWall
        points={saved}
        total={points.length}
        lang={lang}
        dict={{
          account,
          errors,
          layers,
          imagePlaceholder: home.imagePlaceholder,
          explore: nav.explore,
        }}
      />
    </>
  );
}
