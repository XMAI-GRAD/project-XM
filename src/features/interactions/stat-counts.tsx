import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getStats } from "./queries";

/** Favorite (heritages only) and comment counts for one slug. Renders nothing while loading or on error. */
export function StatCounts({
  lang,
  slug,
  favorites = false,
  className,
}: {
  lang: Locale;
  slug: string;
  favorites?: boolean;
  className?: string;
}) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <Counts
          lang={lang}
          slug={slug}
          favorites={favorites}
          className={className}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

// ponytail: "1 comments" in English; add plural rules if the copy needs it.
async function Counts({
  lang,
  slug,
  favorites,
  className,
}: {
  lang: Locale;
  slug: string;
  favorites: boolean;
  className?: string;
}) {
  const { stats } = getDictionary(lang);
  const count = (await getStats())[slug] ?? { favorites: 0, comments: 0 };
  return (
    <span className={className}>
      {favorites && `${count.favorites} ${stats.favorites} · `}
      {count.comments} {stats.comments}
    </span>
  );
}
