"use server";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { heritageSlugs } from "@/content";
import type { Result } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(
  heritageSlug: string,
): Promise<Result<{ favorited: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError && !isAuthSessionMissingError(authError)) {
    console.error("toggleFavorite auth", authError);
    return { ok: false, error: "unknown" };
  }
  if (!user) return { ok: false, error: "unauthenticated" };

  if (typeof heritageSlug !== "string" || !heritageSlugs.has(heritageSlug))
    return { ok: false, error: "invalid_input" };

  const row = { user_id: user.id, heritage_slug: heritageSlug };
  const { data: removed, error: deleteError } = await supabase
    .from("favorites")
    .delete()
    .match(row)
    .select("heritage_slug");
  if (deleteError) {
    console.error("toggleFavorite delete", deleteError);
    return { ok: false, error: "unknown" };
  }

  let favorited = false;
  if (removed.length === 0) {
    // ignoreDuplicates: a concurrent toggle that already inserted isn't an error.
    const { error } = await supabase
      .from("favorites")
      .upsert(row, { ignoreDuplicates: true });
    if (error) {
      console.error("toggleFavorite insert", error);
      return { ok: false, error: "unknown" };
    }
    favorited = true;
  }
  refresh();
  return { ok: true, data: { favorited } };
}
