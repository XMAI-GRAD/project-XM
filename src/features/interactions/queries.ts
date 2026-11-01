import "server-only";
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
}

/** The latest 50 comments on a heritage or article slug, newest first. Reads cookies: render inside <Suspense>. */
export async function getComments(slug: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, body, created_at, user_id, author:profiles(display_name, avatar_url)",
    )
    .eq("target_slug", slug)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      displayName: row.author?.display_name ?? "",
      avatarUrl: row.author?.avatar_url ?? null,
    },
  }));
}
