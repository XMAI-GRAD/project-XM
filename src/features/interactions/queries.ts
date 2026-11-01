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
