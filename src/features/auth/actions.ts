"use server";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";
import { siteUrl } from "@/i18n/server";
import type { Result } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./next-path";

const langOf = (formData: FormData): Locale => {
  const lang = String(formData.get("lang") ?? "");
  return hasLocale(lang) ? lang : defaultLocale;
};

export async function signInWithGoogle(formData: FormData): Promise<never> {
  const lang = langOf(formData);
  const next = safeNextPath(String(formData.get("next") ?? ""), `/${lang}`);
  // The request's own origin keeps login working on preview URLs.
  const origin = (await headers()).get("origin") ?? siteUrl;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) {
    console.error("signInWithGoogle", error);
    redirect(`/${lang}/login?error=auth`);
  }
  redirect(data.url);
}

export async function signOut(formData: FormData): Promise<never> {
  const lang = langOf(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("signOut", error);
  redirect(`/${lang}`);
}

export async function updateProfile(
  _prev: Result<{ displayName: string }> | null,
  formData: FormData,
): Promise<Result<{ displayName: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError && !isAuthSessionMissingError(authError)) {
    console.error("updateProfile auth", authError);
    return { ok: false, error: "unknown" };
  }
  if (!user) return { ok: false, error: "unauthenticated" };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const length = [...displayName].length; // code points, like char_length()
  if (length < 1 || length > 50) return { ok: false, error: "invalid_input" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (error) {
    console.error("updateProfile", error);
    return { ok: false, error: "unknown" };
  }
  refresh();
  return { ok: true, data: { displayName } };
}
