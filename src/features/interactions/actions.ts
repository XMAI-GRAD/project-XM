"use server";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { pointSlugs } from "@/content";
import type { Result } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import {
  parseCommentBody,
  parseCommentId,
  parseParentId,
} from "./comment-input";

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
  pointSlug: string,
): Promise<Result<{ favorited: boolean }>> {
  const auth = await authed("toggleFavorite");
  if (!auth.ok) return { ok: false, error: auth.error };
  const { supabase, user } = auth;

  if (typeof pointSlug !== "string" || !pointSlugs.has(pointSlug))
    return { ok: false, error: "invalid_input" };

  const row = { user_id: user.id, heritage_slug: pointSlug };
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
  const parentId = parseParentId(formData.get("parentId"));
  if (
    typeof slug !== "string" ||
    !pointSlugs.has(slug) ||
    body === null ||
    parentId === undefined
  )
    return { ok: false, error: "invalid_input" };

  // A reply's parent must be a top-level comment on the same slug. RLS checks
  // this too, but checking here keeps a 42501 below meaning only the rate limit.
  if (parentId !== null) {
    const { data: parent, error } = await supabase
      .from("comments")
      .select("parent_id, target_slug")
      .eq("id", parentId)
      .maybeSingle();
    if (error) {
      console.error("addComment parent", error);
      return { ok: false, error: "unknown" };
    }
    if (!parent || parent.parent_id !== null || parent.target_slug !== slug)
      return { ok: false, error: "not_found" };
  }

  // user_id defaults to auth.uid(); the RLS check allows 1 comment per 10 s.
  const { error } = await supabase
    .from("comments")
    .insert({ target_slug: slug, body, parent_id: parentId });
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

  // RLS hides other users' rows from delete (unless you're an admin), so
  // theirs count as not found. Replies go with their parent (on delete cascade).
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
