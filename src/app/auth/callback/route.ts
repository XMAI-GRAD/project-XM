import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { safeNextPath } from "@/features/auth/next-path";
import { createClient } from "@/lib/supabase/server";

// OAuth return: exchange the code for a session cookie, then go to `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), `/${defaultLocale}`);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error("auth callback", error);
  }
  return NextResponse.redirect(
    new URL(`/${defaultLocale}/login?error=auth`, request.url),
  );
}
