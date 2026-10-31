import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";
import { signOut } from "@/features/auth/actions";
import { ProfileForm } from "@/features/auth/profile-form";
import { getCurrentUser } from "@/features/auth/queries";

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
  return (
    <>
      {user.avatarUrl && (
        <Image src={user.avatarUrl} alt="" width={64} height={64} />
      )}
      <ProfileForm displayName={user.displayName} dict={{ account, errors }} />
      <form action={signOut}>
        <input type="hidden" name="lang" value={lang} />
        <button type="submit">{account.signOut}</button>
      </form>
    </>
  );
}
