# project-xm — Spec

Short context, written to paste into AI prompts. It has three parts:

1. Scope & flows
2. Data & API contract
3. Assets & motion

If a change alters behavior described here, update this file in the same PR. Coding rules for AI live in [`AGENTS.md`](AGENTS.md).

- **Repo:** https://github.com/XMAI-GRAD/project-XM (public)
- **Board:** https://github.com/orgs/XMAI-GRAD/projects/1
- **Feature freeze:** 2026-11-20

---

## Part 1 — Scope & user flows

### What it is

A graduation project by a graphic-design student: an online gallery of 5 Vietnamese cultural heritage sites. It ships as a website and an installable PWA, in Vietnamese (default) and English.

**Motion and design are the focus; code is secondary.**

- **Audience:** the defense committee (desktop or projector) and public visitors (desktop and mobile).
- **Feel references:** das.info.vn, collectivedesign.agency/capabilities, wildyriftian.com, analogueagency.com/cases-overview.
- **Function reference:** disannoi.vn (home, tour, map).

### Screens (current idea, not final: depends on the design)

| Screen | Route | Content |
|---|---|---|
| Landing / Gallery | `/[lang]` | Intro + the 5 heritage sites |
| Heritage detail | `/[lang]/heritage/[slug]` | Images, story, related articles, favorite button, comments |
| Interactive map | `/[lang]/map` | Illustrated map, 5 pins joined by a route. Click a pin → info panel → detail page |
| Article | `/[lang]/articles/[slug]` | Reading page, comments |
| Profile | `/[lang]/account` | Login required: display name, favorites list, sign out |

Supporting routes:

| Route | Purpose |
|---|---|
| `/[lang]/login` | "Continue with Google" |
| `/auth/callback` | OAuth return |
| `/[lang]/about` | About, with a `mailto:` contact link |
| localized 404 | Unknown paths and slugs |
| `/[lang]/proto/a`, `/b`, `/c` | Throwaway landing prototypes (B was picked), kept for sharing. Mock text in `proto/_mock.ts` is the one exception to "content only in the JSON". Not in the sitemap. Delete the folder when no longer needed. |

Screens will be added or removed as the design settles. Update this table when they change.

### Flows

- **Browse:** everything is readable without logging in.
- **Header:** signed in, it shows the Google avatar and display name, linking to `/[lang]/account`. Signed out, it shows a login link.
- **Profile while signed out:** `/[lang]/account` redirects to `/[lang]/login?next=/[lang]/account`.
- **Favorite or comment while signed out:**
  1. The user is sent to log in with Google.
  2. They land back on the same page.
- **Language:** a VI/EN switch in the header (Part 3).

### Out of scope

- CMS or admin
- Offline mode, push notifications
- Dark/light mode (one designed theme only)
- E2E tests
- Runtime machine translation
- Email/password login (needs a domain, O-01)
- Contact form (a `mailto:` link instead)
- Comment edit, replies or reporting
- Visits/journey tracking
- Account deletion, analytics

### Open decisions

| ID | Question | Owner | Needed by |
|---|---|---|---|
| O-01 | Buy a domain (~$10/yr `.com`, or a free `.id.vn`)? This unblocks email/password login. | Team | 2026-11-13 |
| O-02 | Will any Lottie or 3D assets come? | Designer | Before motion work |
| O-03 | Map camera: user pan/zoom, or only an automatic zoom-to-pin? | Designer | Before map camera work |
| O-04 | Final screens and content: the 5 sites, articles. | Team + designer | Before content entry |
| O-05 | Map art style: painterly raster, or pure vector? (Part 3) | Designer | Before map work |

### Way of working

- 3 part-time devs, ~1 month.
- AI-assisted: each dev picks an issue and works with their own AI, which reads this file and `AGENTS.md`.
- The backend is small (~1 week of work). FE starts on day 1 against placeholder content.
- FE issues are opened when the designer delivers a screen, one per screen.
- Free tiers only: Vercel Hobby, Supabase Free, GitHub Free.

---

## Part 2 — Data & API contract

### Content: `data/heritages.json`

All heritage content lives in one JSON file. Images live in `public/heritages/<slug>/`.

Until O-04 is settled, the file holds placeholders: slugs `slug-1`…`slug-5` and `article-1`…`article-4`, text like `<Heritage 1 name>`, and solid-color PNGs.

- When the designer changes text, images or the route, they edit the JSON and push assets. Logic code doesn't change.
- Editing on the GitHub web UI → PR → Vercel preview → merge works without installing anything.

```ts
type Localized<T = string> = { vi: T; en: T };

interface Photo {
  src: string;                 // "/heritages/<slug>/<file>.jpg"
  width: number;
  height: number;
  alt: Localized;
}

interface Article {
  slug: string;                // unique across all heritages and articles
  title: Localized;
  excerpt: Localized;
  cover: Photo;
  body: Localized<string[]>;   // paragraphs; switch to Markdown only if rich formatting is needed
  publishedAt: string;         // YYYY-MM-DD
}

interface Heritage {
  slug: string;                // kebab-case, no diacritics, e.g. "hoi-an"
  name: Localized;
  summary: Localized;
  body: Localized<string[]>;
  images: Photo[];
  map: { x: number; y: number };  // pin position in map viewBox units
  articles: Article[];
}

interface HeritageData {
  route: string[];             // heritage slugs in route order; segment i is <path id="route-<route[i]>-<route[i+1]>">
  heritages: Heritage[];
}
```

`src/content/` loads the JSON, checks it at build time and exports typed data plus slug sets. **A bad edit fails the build on the Vercel preview, not on prod.** The build fails when any of these happens:

- a slug is duplicated;
- a route stop isn't a heritage;
- a `vi` or `en` field is empty;
- an image file is missing.

### Database (Supabase Postgres)

RLS is on for every table. Each migration revokes Supabase's default grants from `anon` and `authenticated`, then grants back only what the policies allow.

**`profiles` (exists)**

- **Columns:** `id` (→ `auth.users`), `display_name` (≤ 100 chars), `avatar_url`, `created_at`.
- **Created by:** a trigger, from Google metadata (`full_name`, else `name`, cut to 100 chars).
- **Read:** your own row, or anyone who has commented.
- **Update:** your own `display_name` only. The avatar comes from Google.

**`favorites` (exists)**

- **Columns:** `user_id`, `heritage_slug`, `created_at`. PK `(user_id, heritage_slug)`.
- **Access:** select, insert and delete on your own rows.

**`comments` (new)**

- **Columns:**
  - `id`;
  - `user_id` → **`profiles`**, so the author can be embedded;
  - `target_slug`: a heritage or article slug;
  - `body`: 1–1000 chars after trim;
  - `created_at`.
- **Index:** `(target_slug, created_at desc)`.
- **Access:**
  - Read: everyone.
  - Insert: your own, at most 1 per 10 s, enforced by an RLS check.
  - Delete: your own.
  - No update.

**`contact_submissions` (exists, unused)**

It stays unused while contact is a `mailto:` link.

Moderation: delete rows in the Supabase dashboard.

### API contract

There are no REST endpoints. The FE calls typed Server Actions and server query functions directly. To mock, stub these functions.

```ts
type ActionError = 'unauthenticated' | 'invalid_input' | 'not_found' | 'rate_limited' | 'unknown';
type Result<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };

interface CurrentUser { id: string; displayName: string; avatarUrl: string | null }
interface Comment {
  id: number;
  body: string;
  createdAt: string;           // ISO
  author: { id: string; displayName: string; avatarUrl: string | null };
}

// Queries: server-only, render inside <Suspense>, throw on DB error
getCurrentUser(): Promise<CurrentUser | null>
getMyFavoriteSlugs(): Promise<string[]>              // [] when signed out
getComments(slug: string): Promise<Comment[]>       // latest 50, newest first

// Server Actions
signInWithGoogle(formData: FormData): Promise<never>  // fields: lang, next → redirect to Google
signOut(formData: FormData): Promise<never>           // field: lang → redirect to /[lang]
updateProfile(prev: Result<{ displayName: string }> | null, formData: FormData): Promise<Result<{ displayName: string }>>  // field: displayName, 1–50 chars after trim
toggleFavorite(heritageSlug: string): Promise<Result<{ favorited: boolean }>>
addComment(prev: Result | null, formData: FormData): Promise<Result>  // fields: slug, body (1–1000 chars after trim); 2nd within 10 s → rate_limited
deleteComment(id: number): Promise<Result>            // own comments only, else not_found
```

The UI maps each `ActionError` to a dictionary string. Raw DB errors never reach the client.

### Auth

- Google OAuth through Supabase.
- The Email provider is off in prod. While it is on, anyone with the publishable key can sign up through `/auth/v1/signup`.
- The Email provider is on in dev, for test accounts only.
  - Create them in the dashboard (Users → Add user, with Auto Confirm).
  - The app has no email login UI. Test accounts sign in from scripts with `signInWithPassword`.
- `redirectTo = <request Origin>/auth/callback?next=<path>`.
  - Using the request's own origin keeps login working on preview URLs.
  - The Supabase redirect allowlist must include `http://localhost:3000/**`, the production URL, and `https://*-<vercel-team>.vercel.app/**`.
- `/auth/callback` exchanges the code and redirects to `next`.
  - `next` must be a same-origin path (`safeNextPath`): it starts with `/` and keeps the site's origin when resolved as a URL, so `//host`, `/\host` and `/<tab>/host` fail. Otherwise the redirect goes to `/<lang>` (`/vi` in the callback).
  - When the exchange fails, it redirects to `/vi/login?error=auth`.
  - When `signInWithOAuth` itself fails, `signInWithGoogle` redirects to `/[lang]/login?error=auth`.
- Avatars load through `next/image` from `lh3.googleusercontent.com` (`images.remotePatterns` in `next.config.ts`).
- Server code authorizes with `getUser()` or `getClaims()`, never `getSession()`. Both Supabase projects use asymmetric JWT keys.
- The Google consent screen is published "In production", with basic scopes only.

---

## Part 3 — Assets & motion

### Motion

- **One stack for everyone: GSAP + ScrollTrigger + Lenis** (smooth scroll), through `@gsap/react` (`useGSAP`). Don't mix in Framer Motion or other animation libraries.
- Route lines draw with `stroke-dashoffset` (or GSAP DrawSVG).
- **Reduced motion:** every animation respects `prefers-reduced-motion` (`gsap.matchMedia`). Content appears with no tween, and there's no smooth scroll.

### Theme

- One designed theme. No dark/light mode.
- Ignore the OS dark setting: the designed theme is near-black, so set a fixed `color-scheme: dark` and delete the boilerplate `prefers-color-scheme: dark` CSS.

### Images

- Export JPG or PNG at **2400 px on the long edge**, under ~1 MB each. `next/image` resizes and serves AVIF/WebP automatically.
- Put files in `public/heritages/<slug>/`, with kebab-case names. Record `width`, `height` and `alt { vi, en }` in the JSON.
- Total: under 200 images, under 300 MB.
- Figma files and raw exports never go in the repo (it's public).

### Map

- One fixed `viewBox`. Pin positions in the JSON use viewBox units.
- **Painterly art:** a large raster base image, plus an SVG overlay of the same size that holds the route paths.
- **Pure vector art:** a single SVG.
- Route segments: `<path id="route-<from>-<to>">`, following `route` order in the JSON.
- Outline all text in the SVG and run it through SVGO before committing.
- Pins are `<button>` elements rendered from the JSON, so the map is keyboard accessible.

### Fonts

Fonts must include full Vietnamese glyphs. Load them via `next/font` with the `vietnamese` subset.

### Languages (VI/EN)

- **The switch:** a VI/EN toggle in the header. It feels like a dark/light toggle, but it switches the URL: `/vi/map` ↔ `/en/map`. The choice is remembered in the `NEXT_LOCALE` cookie, which the proxy sets to the locale of the last page visited.
  - Shared links open in the right language.
  - Google indexes both languages.
  - Both versions prerender as static pages.
- **First visit to `/`:** the language comes from the cookie, then the browser's `Accept-Language`, then `vi`.
- **Unprefixed paths:** the proxy redirects any path without a locale to `/<lang>/…`, and a wrong-case locale (`/EN/map`) to lowercase. These paths keep no prefix: `/auth/*`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and Next internals (`/_*`).
- **Content:** every text field is `{ vi, en }` in the JSON. `vi` is the source; `en` is required, and the build check enforces it.
- **UI strings:** they live in `src/i18n/dictionaries/vi.json` and `en.json`, with the same keys in both.
- **Slugs:** one slug per item, shared by both languages, with no diacritics.
- **English copy:** AI may draft it; a human reviews it. No runtime machine translation.

---

## Appendix — environments & ops (not needed in AI prompts)

| Env | Branch | Supabase |
|---|---|---|
| Local | any | `project-xm-dev` (shared) |
| Preview | PRs and `dev` | `project-xm-dev` |
| Production | `main` | `project-xm-prod` |

- **Env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (production and local)
- **Branches:**
  - `main`: production. It only gets release PRs from `dev`.
  - `dev`: development. Branch off `dev` (any name), open a PR into `dev`, and squash merge.
  - Both branches are protected by rulesets: changes go through a PR, with no force-push or deletion. Squash is the only merge method on `dev`; merge commit is the only one on `main`.
  - The commit format is in `AGENTS.md`.
- **Release:**
  1. Push new migrations to prod.
  2. Open a PR `dev` → `main` and merge it with a merge commit.

  Don't squash: a squashed release makes `dev` and `main` diverge. Env vars are set once per Vercel environment (Production/Preview), not per release.
- **CI:** lint, typecheck and build, plus `pnpm test` for the few pure-logic tests.
- **Deploys:** Vercel deploys previews for PRs and `dev`, and production from `main`.
- **Migrations:**
  - run `pnpm db:push` to dev after the PR into `dev` is approved, since the dev DB is shared;
  - push to prod during a release, before merging into `main`.
- **PWA:** `manifest.ts` with 192, 512 and maskable icons. No service worker.
- **SEO:** hreflang metadata, `sitemap.ts`, and a `robots.ts` that disallows `/auth/` and `/<lang>/account` for each locale.
- **Security headers:** `nosniff`, `strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.
- Free Supabase projects pause after 7 days of inactivity.

**Before the defense:**

- [ ] Unpause both Supabase projects. Log in and post a comment on prod the day before.
- [ ] Run the two-account check on prod:
  - B can't see A's favorites.
  - B can't delete A's comments.
  - A signed-out user can't comment.
- [ ] Install the PWA on Android Chrome and iOS Safari.
- [ ] Run Lighthouse on home and map, in both languages.
- [ ] Turn on the OS reduced-motion setting and check that nothing breaks.
