"use server";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { contentSlugs, heritageSlugs } from "@/content";
import type { Result } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { parseCommentBody, parseCommentId } from "./comment-input";

/** The Supabase client and signed-in user, or the error to return. */
async function authed(where: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error && !isAuthSessionMissingError(error)) {
    console.error(`${where} auth`, error);
    return { ok: false, error: "unknown" } as const;
  }
  if (!user) return { ok: false, error: "unauthenticated" } as const;
  return { ok: true, supabase, user } as const;
}

export async function toggleFavorite(
  heritageSlug: string,
): Promise<Result<{ favorited: boolean }>> {
  const auth = await authed("toggleFavorite");
  if (!auth.ok) return { ok: false, error: auth.error };
  const { supabase, user } = auth;

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

export async function addComment(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const auth = await authed("addComment");
  if (!auth.ok) return { ok: false, error: auth.error };
  const { supabase } = auth;

  const slug = formData.get("slug");
  const body = parseCommentBody(formData.get("body"));
  if (typeof slug !== "string" || !contentSlugs.has(slug) || body === null)
    return { ok: false, error: "invalid_input" };

  // user_id defaults to auth.uid(); the RLS check allows 1 comment per 10 s.
  const { error } = await supabase
    .from("comments")
    .insert({ target_slug: slug, body });
  if (error) {
    if (error.code === "42501") return { ok: false, error: "rate_limited" };
    console.error("addComment", error);
    return { ok: false, error: "unknown" };
  }
  refresh();
  return { ok: true, data: undefined };
}

export async function deleteComment(id: number): Promise<Result> {
  const auth = await authed("deleteComment");
  if (!auth.ok) return { ok: false, error: auth.error };
  const { supabase } = auth;

  const commentId = parseCommentId(id);
  if (commentId === null) return { ok: false, error: "invalid_input" };

  // RLS hides other users' rows from delete, so theirs count as not found.
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .select("id");
  if (error) {
    console.error("deleteComment", error);
    return { ok: false, error: "unknown" };
  }
  // Refresh on not_found too: the comment may already be gone (another tab).
  refresh();
  if (data.length === 0) return { ok: false, error: "not_found" };
  return { ok: true, data: undefined };
}
