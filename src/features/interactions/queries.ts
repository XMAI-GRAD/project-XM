import "server-only";
import { contentSlugs } from "@/content";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user's favorite heritage slugs, newest first; [] when signed out. Reads cookies: render inside <Suspense>. */
export async function getMyFavoriteSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError) throw authError;
  const id = auth?.claims.sub;
  if (!id) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("heritage_slug")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => row.heritage_slug);
}

export interface Comment {
  id: number;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  /** Oldest first; always [] on a reply (one level only). */
  replies: Comment[];
}

interface CommentRow {
  id: number;
  body: string;
  created_at: string;
  user_id: string;
  author: { display_name: string | null; avatar_url: string | null } | null;
}

const toComment = (row: CommentRow, replies: Comment[] = []): Comment => ({
  id: row.id,
  body: row.body,
  createdAt: row.created_at,
  author: {
    id: row.user_id,
    displayName: row.author?.display_name ?? "",
    avatarUrl: row.author?.avatar_url ?? null,
  },
  replies,
});

const commentColumns =
  "id, body, created_at, user_id, author:profiles(display_name, avatar_url)";

/** The latest 50 top-level comments on a heritage or article slug, newest first, with all their replies. Reads cookies: render inside <Suspense>. */
// ponytail: replies aren't capped; add a limit if a thread ever gets long.
export async function getComments(slug: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `${commentColumns}, replies:comments!comments_parent_id_fkey(${commentColumns})`,
    )
    .eq("target_slug", slug)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "replies", ascending: true })
    .limit(50);
  if (error) throw error;
  return data.map((row) =>
    toComment(
      row,
      row.replies.map((reply) => toComment(reply)),
    ),
  );
}

export interface Stats {
  favorites: number;
  comments: number;
}

/** Favorite and comment counts (replies included) per content slug; a missing slug means 0. Render inside <Suspense>. */
export async function getStats(): Promise<Record<string, Stats>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_stats");
  if (error) throw error;
  const stats: Record<string, Stats> = {};
  for (const row of data)
    if (contentSlugs.has(row.slug))
      stats[row.slug] = {
        favorites: Number(row.favorites),
        comments: Number(row.comments),
      };
  return stats;
}
