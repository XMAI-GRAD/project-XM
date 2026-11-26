import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  hasLocale,
  localeCookie,
  type Locale,
} from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

// Paths that never get a locale prefix. `_` covers Next internals like /_next/webpack-hmr.
const unlocalized =
  /^\/(?:_|auth(?:\/|$)|sitemap\.xml$|robots\.txt$|manifest\.webmanifest$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (!unlocalized.test(pathname) && !hasLocale(first)) {
    const url = request.nextUrl.clone();
    const lower = first.toLowerCase();
    url.pathname = hasLocale(lower)
      ? `/${lower}${pathname.slice(first.length + 1)}` // /EN/map → /en/map
      : `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const response = await updateSession(request);
  // Remember the language of the last page visited, for the next visit to `/`.
  if (hasLocale(first) && request.cookies.get(localeCookie)?.value !== first) {
    response.cookies.set(localeCookie, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

// Cookie, then Accept-Language (by q, primary subtag only), then the default.
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(localeCookie)?.value;
  if (cookie && hasLocale(cookie)) return cookie;

  const match = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        lang: tag.split("-")[0].toLowerCase(),
        q: q ? Number(q.trim().slice(2)) || 0 : 1,
      };
    })
    .sort((a, b) => b.q - a.q)
    .find((entry) => entry.q > 0 && hasLocale(entry.lang));

  return (match?.lang as Locale | undefined) ?? defaultLocale;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
