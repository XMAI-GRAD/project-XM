import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getHeritage } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";
import { signOut } from "@/features/auth/actions";
import { ProfileForm } from "@/features/auth/profile-form";
import { getCurrentUser } from "@/features/auth/queries";
import { getMyFavoriteSlugs } from "@/features/interactions/queries";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  return {
    title: getDictionary(lang).account.title,
    robots: { index: false },
  };
}

export default async function AccountPage() {
  const lang = await getLocale();
  const { account } = getDictionary(lang);
  return (
    <>
      <h1>{account.title}</h1>
      <Suspense>
        <Profile lang={lang} />
      </Suspense>
    </>
  );
}

async function Profile({ lang }: { lang: Locale }) {
  const user = await getCurrentUser();
  if (!user)
    redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/account`)}`);
  const { account, errors } = getDictionary(lang);
  // Skips slugs whose heritage was removed from the content.
  const favorites = (await getMyFavoriteSlugs()).flatMap(
    (slug) => getHeritage(slug) ?? [],
  );
  return (
    <>
      {user.avatarUrl && (
        <Image src={user.avatarUrl} alt="" width={64} height={64} />
      )}
      <ProfileForm displayName={user.displayName} dict={{ account, errors }} />
      <h2>{account.favorites}</h2>
      {favorites.length > 0 ? (
        <ul>
          {favorites.map((h) => (
            <li key={h.slug}>
              <Link href={`/${lang}/heritage/${h.slug}`}>{h.name[lang]}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>{account.noFavorites}</p>
      )}
      <form action={signOut}>
        <input type="hidden" name="lang" value={lang} />
        <button type="submit">{account.signOut}</button>
      </form>
    </>
  );
}
