import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "./queries";

/** Header account status. Reads cookies: render inside <Suspense>. */
export async function AccountStatus({ lang }: { lang: Locale }) {
  const user = await getCurrentUser();
  if (!user) return <LoginLink lang={lang} />;
  return (
    <Link href={`/${lang}/account`}>
      {user.avatarUrl && (
        <Image src={user.avatarUrl} alt="" width={24} height={24} />
      )}
      {user.displayName || getDictionary(lang).nav.account}
    </Link>
  );
}

export function LoginLink({ lang }: { lang: Locale }) {
  return <Link href={`/${lang}/login`}>{getDictionary(lang).nav.login}</Link>;
}
