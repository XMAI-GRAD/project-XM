import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

/** The signed-in user, or null. Reads cookies: render inside <Suspense>. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  // No session → { data: null, error: null }.
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError) throw authError;
  const id = auth?.claims.sub;
  if (!id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;

  return {
    id,
    displayName: data?.display_name ?? "",
    avatarUrl: data?.avatar_url ?? null,
  };
}
