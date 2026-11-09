# project-xm — Spec

Short context, written to paste into AI prompts. It has three parts:

1. Scope & flows
2. Data & API contract
3. Assets, color & motion

If a change alters behavior described here, update this file in the same PR. Coding rules for AI live in [`AGENTS.md`](AGENTS.md).

- **Repo:** https://github.com/XMAI-GRAD/project-XM (public)
- **Board:** https://github.com/orgs/XMAI-GRAD/projects/1
- **Feature freeze:** 2026-11-20
- **Content source:** the content document "NỘI DUNG WEB HANOI CREATIVE CITY · bản 07/11/2026" (kept outside the repo). Its text is copied into the YAML files in `data/`.

---

## Part 1 — Scope & user flows

### What it is

The website of **Hanoi Creative City — UNESCO City of Design**, run by the Trung tâm Điều phối các Hoạt động Sáng tạo Hà Nội. It is a graduation project by a graphic-design student. It ships as a website and an installable PWA, in Vietnamese (default) and English.

Its core is the content program **"Mạch nối ngàn năm"**: 12 points in three layers, matching the 12 entries of the printed guidebook one to one.

| Layer     | VI   | Points | What                                          |
| --------- | ---- | ------ | --------------------------------------------- |
| **PLACE** | ĐỊA  | 5      | Landmarks (`d01`–`d05`)                       |
| **TASTE** | VỊ   | 4      | Seasonal dishes, one per season (`v01`–`v04`) |
| **CRAFT** | NGHỀ | 3      | Craft villages (`n01`–`n03`)                  |

**Motion and design are the focus; code is secondary.**

- **Audience:** the defense committee (desktop or projector) and public visitors.
- **Desktop only until 2026-11-23.** Mobile gets its own design after that date.
- **Feel references:** das.info.vn, collectivedesign.agency/capabilities, wildyriftian.com, analogueagency.com/cases-overview.
- **Function references:** hanoicreativecity.com (events), disannoi.vn (map).

### Sitemap

```
/[lang]                    Home
├── about                  About us
├── explore                Explore: PLACE · TASTE · CRAFT
│   └── [slug]             Point detail (12 pages)
├── maps                   Maps: one map, three layers
├── events                 Events: placeholder gallery
├── join                   Join the network: two mock forms
├── account                Profile (login required, not in the nav)
└── login                  Login (not in the nav)
```

- **Layout:** every page uses the wireframe of the former prototype A: a navy side rail (logo, explore CTA), a top bar with the nav, then full-width bands. New UI builds on this frame.
- **Header (desktop):** logo · HOME · ABOUT US · EXPLORE · MAPS · EVENTS · JOIN · search · VI/EN · login link or avatar.
- **Footer:** menu, contact block, credits.
- **`sitemap.xml`:** every public page in both languages: home, about, explore, the 12 point pages, maps, events, join. It leaves out account, login and `/auth/*`.

### Screens

| Screen       | Route                    | Content                                                                                                                                                                                                                                                                               |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home         | `/[lang]`                | Hero (tagline, intro, [Explore the map] · Join). Block 1: intro + three overlapping circles (State · Artists · Public). Block 2: map teaser with the three layers. Block 3: next 3 events. Block 4: join (Individual · Organization).                                                 |
| About        | `/[lang]/about`          | Title and lede, UNESCO intro and video, three things the Centre does, five fields, timeline (navy band), operators, join CTA                                                                                                                                                          |
| Explore      | `/[lang]/explore`        | Title and lead, folder tabs ĐỊA · VỊ · NGHỀ over a framed list of rows, empty state                                                                                                                                                                                                   |
| Point detail | `/[lang]/explore/[slug]` | Photo hero (name, layer, address, directions, counts, favorite), info bar per layer, audio (VI, with the story as text), name line (with the craft, on CRAFT points) pinned once the hero has scrolled away, hook, story, little-known fact, nearby points, comments in a side column |
| Maps         | `/[lang]/maps`           | One map, three layers, tap to switch layer. Free-form (Part 3, Map)                                                                                                                                                                                                                   |
| Events       | `/[lang]/events`         | Placeholder gallery (below)                                                                                                                                                                                                                                                           |
| Join         | `/[lang]/join`           | Individual and Organization mock forms (below)                                                                                                                                                                                                                                        |
| Profile      | `/[lang]/account`        | Login required: avatar, display name (edited in place), saved points as framed figures with a per-card remove (the card stays, faded, with "Save again" until reload), sign out                                                                                                       |

Supporting routes:

| Route            | Purpose                 |
| ---------------- | ----------------------- |
| `/[lang]/login`  | "Continue with Google"  |
| `/auth/callback` | OAuth return            |
| localized 404    | Unknown paths and slugs |

The old routes `/[lang]/heritage/[slug]`, `/[lang]/map`, `/[lang]/articles/[slug]` and `/[lang]/proto/*` are removed, with no redirects: the site never launched.

**Explore behavior:**

- **Rows:** a row shows the name and a meta line, with no code. The meta line is the kind alone. Clicking it opens the first story paragraph and a [View detail] link to the point page; one row is open at a time.
- **Motion:** the first layer's rows unroll one by one, from top to bottom, on arrival. Selecting a tab rolls the current rows up and unrolls the new ones. A row opens and closes with a height tween, and opening one collapses the row already open. On a point page the hero and info bar animate on arrival, and the content below reveals once as it scrolls into view. Under reduced motion everything changes at once.
- **Point info bar:** PLACE shows year, type, hours and admission; TASTE shows dish, year opened (when known), price range, hours and the best season; CRAFT shows craft and hours. Any field without data is left out. A point without a photo shows a placeholder in the hero.
- **[Directions]** opens `https://www.google.com/maps/search/?api=1&query=<encoded address>` in a new tab. No API key.
- **Search (header)** matches point names in the current language, ignoring case and diacritics. Results link to the point detail.

**Events (placeholder):**

- A gallery of event cards in the spirit of hanoicreativecity.com/su-kien, designed better.
- Cards show image · date · title · place. Data comes from `data/events.yaml` and is placeholder only.
- Until an event has a photo, its frame shows an accent fill with an "Image" chip, like the point panels.
- Cards are not links. There are no filters, no detail pages, no registration and no calendar export.
- Home block 3 shows the first 3 events by date. With no events, both show the empty text.

**Join (mock):**

- Two forms. **Individual:** full name · email · field · portfolio link · project description (≤ 300 chars). **Organization:** organization name · contact person · email · field · size · collaboration needs.
- "Field" is a select of the five fields: Design, Architecture, Fine arts, Performing arts, Crafts.
- Native validation only (`required`, `type="email"`, `maxlength`).
- **Submit sends nothing:** no Server Action, no DB write, no email, no login. It swaps the form for a "sent" message.
- Home block 4 links to `/[lang]/join#individual` and `#organization`; the page opens with that form chosen.

### Flows

- **Browse:** everything is readable without logging in.
- **Header:** signed in, it shows the Google avatar and display name, linking to `/[lang]/account`. Signed out, it shows a login link.
- **Profile while signed out:** `/[lang]/account` redirects to `/[lang]/login?next=/[lang]/account`.
- **Favorite or comment on a point while signed out:**
  1. The user is sent to log in with Google.
  2. They land back on the same page.
- **Language:** a VI/EN switch in the header (Part 3).

### Out of scope

- Mobile layouts (until 2026-11-23)
- CMS or admin dashboard (an admin only deletes comments, on the site)
- Articles
- Event detail pages, filters, registration, calendar export
- Real form submission (Join), contact form
- Map APIs, tile services or API keys
- [Near me] and point coordinates (`geo`)
- Offline mode, push notifications
- Dark/light mode (one designed theme only)
- E2E tests
- Runtime machine translation
- Email/password login (needs a domain)
- Comment edit, nested replies (more than one level) or reporting
- Visits/journey tracking
- Account deletion, analytics

---

## Part 2 — Data & API contract

### Content: YAML in `data/`

One YAML file per page, plus one file per layer for the points.

| File                     | Holds                                                                           |
| ------------------------ | ------------------------------------------------------------------------------- |
| `data/site.yaml`         | Brand name, full name, tagline, motto (long and short), contact block, credits  |
| `data/home.yaml`         | Home hero and block 1 (intro, the three roles); block 4 reads `join.yaml`       |
| `data/about.yaml`        | About: lede, intro, video, three things we do, five fields, timeline, operators |
| `data/explore.yaml`      | Explore title and lead                                                          |
| `data/maps.yaml`         | Maps title, lead, and the one-line intro per layer (also used by home block 2)  |
| `data/points/place.yaml` | The 5 PLACE points                                                              |
| `data/points/taste.yaml` | The 4 TASTE points                                                              |
| `data/points/craft.yaml` | The 3 CRAFT points                                                              |
| `data/events.yaml`       | Placeholder events (home block 3 and the events page)                           |
| `data/join.yaml`         | Join title, lead, and the title and intro of each audience                      |

- **Content vs UI strings:** copy from the content document goes in YAML. Interface text goes in the dictionaries (Part 3, Languages): nav labels, buttons, form labels, info-bar labels ("What to order", "Price range"…), empty states, aria labels.
- When the designer changes text or images, they edit YAML and push assets. Logic code doesn't change. Editing on the GitHub web UI → PR → Vercel preview → merge works without installing anything.

**Getting data:** read content only through `src/content/`, which imports the YAML as text through the bundler (so `next dev` reloads an edit) and parses it with the `yaml` package.

```ts
getPoints(layer: Layer): Point[]      // in file order
getPoint(slug: string): Point | undefined
pointSlugs: ReadonlySet<string>      // validates every user-supplied slug
getEvents(): EventCard[]              // sorted by date; added with data/events.yaml
getPage(name)                         // typed per page in `Pages`; add a page's type when its file lands
```

**Points:**

```ts
type Localized<T = string> = { vi: T; en: T };
type Layer = "place" | "taste" | "craft"; // from the file name; not written in YAML
type Season = "spring" | "summer" | "autumn" | "winter";

interface Photo {
  src: string; // "/points/<slug>/<file>.jpg"
  width: number;
  height: number;
  alt: Localized;
}

// One shape for all three layers.
interface Point {
  slug: string; // kebab-case, no diacritics, e.g. "hoang-thanh-thang-long"
  code: string; // d01…, v01…, n01…; the prefix matches the layer
  layer: Layer;
  name: Localized;
  kind: Localized; // PLACE: type of site · TASTE: dish to order · CRAFT: the craft
  since?: Localized; // PLACE: era or year · TASTE: year opened, when known
  season?: Season; // TASTE only
  hours: Localized; // like 8H00-17H00 or 24/7; " / " separates entries, shown one per line; a line in parentheses is a small note
  price?: Localized; // PLACE and TASTE; " / " as in hours
  address: string; // also the [Directions] query
  hook: Localized; // the opening verse or line; " / " separates verse lines
  story: Localized<string[]>; // paragraphs; also the audio transcript
  fact: Localized; // "Little-known fact"
  nearby: { slug: string; km: number }[];
  images: Photo[]; // the first is the cover; empty until there is a photo
  audio?: string; // "/points/<slug>/audio-vi.mp3"; Vietnamese only
}
```

**Events:**

```ts
interface EventCard {
  title: Localized;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  place: Localized;
  image?: Photo; // "/events/<file>.jpg"; absent until there is a photo
}
```

**Pages** (`site`, `home`, `about`, `explore`, `maps`, `join`): each file's shape is typed in `src/content/`, next to its loader. Every text leaf is `Localized`.

**Build check.** `src/content/` validates all YAML when it loads, so **a bad edit fails the build on the Vercel preview, not on prod.** The build fails when any of these happens:

- a slug or code is duplicated, or a code prefix doesn't match its layer;
- a `nearby` slug isn't a point;
- a `vi` field is empty;
- an event `date` or `endDate` isn't a real `YYYY-MM-DD` day, or `endDate` is before `date`;
- an image or audio file is missing.

### Database (Supabase Postgres)

RLS is on for every table. Each migration revokes Supabase's default grants from `anon` and `authenticated`, then grants back only what the policies allow.

User data is keyed by point slug. Column names from applied migrations stay as they are: `favorites.heritage_slug` holds a point slug.

**`profiles` (exists)**

- **Columns:** `id` (→ `auth.users`), `display_name` (≤ 100 chars), `avatar_url`, `role` (`user` | `admin`, default `user`), `created_at`.
- **Created by:** a trigger, from Google metadata (`full_name`, else `name`, cut to 100 chars).
- **Read:** your own row, or anyone who has commented.
- **Update:** your own `display_name` only. The avatar comes from Google. Nobody can change `role` through the API.
- **Admins:** grant with SQL in the dashboard: `update public.profiles set role = 'admin' where id = '<uuid>';`. `public.is_admin()` (security definer, `authenticated` only) is what policies check.

**`favorites` (exists)**

- **Columns:** `user_id`, `heritage_slug` (a point slug), `created_at`. PK `(user_id, heritage_slug)`.
- **Access:** select, insert and delete on your own rows.

**`comments` (exists)**

- **Columns:**
  - `id`;
  - `user_id` → **`profiles`**, so the author can be embedded;
  - `target_slug`: a point slug;
  - `parent_id` → `comments`, null for a top-level comment. Replies are one level deep: a reply's parent is a top-level comment on the same slug. Deleting a comment deletes its replies (`on delete cascade`);
  - `body`: 1–1000 chars after trim;
  - `created_at`.
- **Indexes:** `(target_slug, created_at desc)` for the list; `(user_id, created_at desc)` for the rate limit and the profiles check; `(parent_id)` for replies and the cascade.
- **Access:**
  - Read: everyone.
  - Insert: your own comment or reply, at most 1 per 10 s, enforced by an RLS check. The same check enforces the reply rule. Clients insert only `target_slug`, `body` and `parent_id`; `user_id` defaults to `auth.uid()`, and `created_at` can't be set, so a backdated row can't get around the limit.
  - Delete: your own, or any comment if you're an admin.
  - No update.

**`contact_submissions` (exists, unused)**

It stays unused: the Join forms are mock and contact is a `mailto:` link.

Moderation: an admin deletes comments on the site; each comment shows them a delete button.

**`get_stats()` (RPC)**

Favorite and comment counts per slug: `(slug, favorites, comments)`. Comment counts include replies. It is security definer, because `favorites` RLS only shows your own rows; it returns counts only. Callable by `anon` and `authenticated`.

### API contract

There are no REST endpoints. The FE calls typed Server Actions and server query functions directly. To mock, stub these functions.

```ts
type ActionError = 'unauthenticated' | 'invalid_input' | 'not_found' | 'rate_limited' | 'unknown';
type Result<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };

interface CurrentUser { id: string; displayName: string; avatarUrl: string | null; isAdmin: boolean }  // isAdmin is a UI hint; RLS is the check
interface Comment {
  id: number;
  body: string;
  createdAt: string;           // ISO
  author: { id: string; displayName: string; avatarUrl: string | null };
  replies: Comment[];          // oldest first; always [] on a reply
}
interface Stats { favorites: number; comments: number }

// Queries: server-only, render inside <Suspense>, throw on DB error
getCurrentUser(): Promise<CurrentUser | null>
getMyFavoriteSlugs(): Promise<string[]>              // [] when signed out
getComments(slug: string): Promise<Comment[]>       // latest 50 top-level, newest first, each with all its replies
getStats(): Promise<Record<string, Stats>>          // keyed by point slug; a missing slug means 0

// Server Actions
signInWithGoogle(formData: FormData): Promise<never>  // fields: lang, next → redirect to Google
signOut(formData: FormData): Promise<never>           // field: lang → redirect to /[lang]
updateProfile(prev: Result<{ displayName: string }> | null, formData: FormData): Promise<Result<{ displayName: string }>>  // field: displayName, 1–50 chars after trim
toggleFavorite(pointSlug: string): Promise<Result<{ favorited: boolean }>>
addComment(prev: Result | null, formData: FormData): Promise<Result>  // fields: slug, body (1–1000 chars after trim), parentId? (a top-level comment's id on the same slug, else not_found); 2nd within 10 s → rate_limited
deleteComment(id: number): Promise<Result>            // own comments, or any if admin; else not_found
```

Every `slug` argument is checked against `pointSlugs`. The UI maps each `ActionError` to a dictionary string. Raw DB errors never reach the client.

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

## Part 3 — Assets, color & motion

### Color (source of truth)

This section is the source of truth for color. `DESIGN.md`, `globals.css` and every component follow it. Token names are plain (`navy-500`, `seashell`); don't name them by meaning.

| Token            | Hex       | Share | Role                                     |
| ---------------- | --------- | ----- | ---------------------------------------- |
| `navy-500`       | `#0d1855` | ~12%  | Primary (deep navy)                      |
| `navy-400`       | `#273991` | ~4%   | Navy ramp                                |
| `navy-300`       | `#394fa0` | ~2%   | Navy ramp                                |
| `navy-200`       | `#5c76ba` | ~2%   | Navy ramp                                |
| `seashell`       | `#fff6f1` | ~40%  | The "white": background of most surfaces |
| `frosted-blue`   | `#9ceaff` | ~10%  | Accent                                   |
| `dark-cyan`      | `#008b86` | ~10%  | Accent                                   |
| `brick-red`      | `#b7262a` | ~5%   | Accent                                   |
| `sunflower-gold` | `#fec35a` | ~5%   | Accent                                   |
| `lime`           | `#cbdb2b` | ~5%   | Accent                                   |
| `mauve`          | `#dbb8ff` | ~5%   | Accent                                   |

**Ratio: 20% navy ramp · 40% seashell · 40% accents** (palette confirmed by the designer, 2026-11-07). Keep it in mind when building UI without a design from the designer. Navy is for the rail, the footer and type; whole bands can use frosted blue or dark cyan.

**Text on color:**

- Seashell text on navy (any step) and on brick red.
- Navy (`navy-500`) text on seashell and on every other accent.
- Dark cyan with any text, and seashell on `navy-200`, reach only about 4:1. Use them for large or bold text only.

**Layers:**

| Layer | Background     | Pin            |
| ----- | -------------- | -------------- |
| PLACE | sunflower gold | navy-500       |
| TASTE | brick red      | sunflower gold |
| CRAFT | dark cyan      | brick red      |

### Theme

- One designed theme on a seashell background. No dark/light mode.
- Ignore the OS dark setting: set a fixed `color-scheme: light`.

### Motion

- **One stack for everyone: GSAP + ScrollTrigger + Lenis** (smooth scroll), through `@gsap/react` (`useGSAP`). Don't mix in Framer Motion or other animation libraries.
- **Reduced motion:** every animation respects `prefers-reduced-motion` (`gsap.matchMedia`). Content appears with no tween, and there's no smooth scroll.

### Images and audio

- Export JPG or PNG at **2400 px on the long edge**, under ~1 MB each. `next/image` resizes and serves AVIF/WebP automatically.
- Put point files in `public/points/<slug>/` and event files in `public/events/`, with kebab-case names. Record `width`, `height` and `alt { vi, en }` in the YAML.
- Audio: one optional Vietnamese MP3 per point, `public/points/<slug>/audio-vi.mp3`. The story text is its transcript.
- Total: under 200 images, under 300 MB.
- Figma files and raw exports never go in the repo (it's public).

### Map

Free-form for now: the map owner picks the art, the stack and the interaction, and this spec sets no rules for them. Two limits still apply:

- No map API, tile service or API key.
- Points come from `src/content/`. Never keep a second copy of point data for the map.

### Fonts

Fonts must include full Vietnamese glyphs. Load them via `next/font/google` with the `vietnamese` subset.

| Use                     | Font  | CSS variable     |
| ----------------------- | ----- | ---------------- |
| Heading, display        | Phudu | `--font-display` |
| Subheading              | Phudu | `--font-display` |
| Body text, labels, meta | Inter | `--font-body`    |

### Languages (VI/EN)

- **The switch:** a VI/EN toggle in the header. It feels like a dark/light toggle, but it switches the URL: `/vi/maps` ↔ `/en/maps`. The choice is remembered in the `NEXT_LOCALE` cookie, which the proxy sets to the locale of the last page visited.
  - Shared links open in the right language.
  - Google indexes both languages.
  - Both versions prerender as static pages.
- **First visit to `/`:** the language comes from the cookie, then the browser's `Accept-Language`, then `vi`.
- **Unprefixed paths:** the proxy redirects any path without a locale to `/<lang>/…`, and a wrong-case locale (`/EN/maps`) to lowercase. These paths keep no prefix: `/auth/*`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and Next internals (`/_*`).
- **Content:** every text field is `{ vi, en }` in the YAML. `vi` is the source and is required. `en` may stay empty (`""` or `[]`) until the team translates it: the page then shows the Vietnamese, and the build logs how many fields are untranslated. The content document's appendix fixes the English names of the layers and points.
- **UI strings:** they live in `src/i18n/dictionaries/vi.json` and `en.json`, with the same keys in both.
- **Slugs:** one slug per item, shared by both languages, with no diacritics.
- **English copy:** the team writes it. No runtime machine translation.

---

## Appendix — environments & ops (not needed in AI prompts)

| Env        | Branch        | Supabase                  |
| ---------- | ------------- | ------------------------- |
| Local      | any           | `project-xm-dev` (shared) |
| Preview    | PRs and `dev` | `project-xm-dev`          |
| Production | `main`        | `project-xm-prod`         |

- **Free tiers only:** Vercel Hobby, Supabase Free, GitHub Free.
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

- **CI:** Prettier check, lint, typecheck and build, plus `pnpm test` for the few pure-logic tests.
- **Deploys:** Vercel deploys previews for PRs and `dev`, and production from `main`.
- **Migrations:**
  - run `pnpm db:push` to dev after the PR into `dev` is approved, since the dev DB is shared;
  - push to prod during a release, before merging into `main`.
- **Instant navigation (opted out):**
  - `explore/[slug]` sets `export const instant = false`.
  - Why: the page awaits `params` at the top, outside `<Suspense>`. A click to it waits for the server before anything shows.
  - Without the opt-out, Next's dev-only instant validation shows a red overlay. The build isn't affected, and the pages are prerendered via `generateStaticParams`, so the wait is short.
  - To make it instant later:
    1. Pass `params` (the Promise) to child components.
    2. Await it inside `<Suspense>` with a content fallback.
    3. Delete the `instant` export.
  - See `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`.
- **PWA:** `manifest.ts` with 192, 512 and maskable icons. No service worker.
- **SEO:** hreflang metadata, `sitemap.ts` (pages listed in Part 1, Sitemap), and a `robots.ts` that disallows `/auth/` and `/<lang>/account` for each locale.
- **Security headers:** `nosniff`, `strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.
- Free Supabase projects pause after 7 days of inactivity.

**Before the defense:**

- [ ] Unpause both Supabase projects. Log in and post a comment on prod the day before.
- [ ] Run the two-account check on prod:
  - B can't see A's favorites.
  - B can't delete A's comments.
  - B can't make themself admin.
  - Admin A can delete B's comment, and its replies go with it.
  - A signed-out user sees the counts.
  - A signed-out user can't comment.
- [ ] Install the PWA on Android Chrome and iOS Safari.
- [ ] Run Lighthouse on home and maps, in both languages.
- [ ] Turn on the OS reduced-motion setting and check that nothing breaks.
