<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

Read `SPEC.md` first. It is the source of truth. If your change alters behavior it describes, update it in the same PR.

- **Content:**
  - All heritage content lives in `data/heritages.json`, with images in `public/heritages/<slug>/`.
  - Read it only through `src/content/`, which is typed and validated at build.
  - Never hardcode content text in components.
- **DB.** The DB holds user data only, keyed by slug.
- **Validate input on the server:**
  - every user-supplied slug, against the content slug sets;
  - every `lang`, with `hasLocale`.
- **Supabase:**
  - Never use the `service_role` / secret key.
  - Schema changes go only in new files in `supabase/migrations/`. Never edit an applied migration.
  - A new table follows this order: create → enable RLS → policies → `revoke all … from anon, authenticated` → explicit grants.
- **Query errors.** Query functions throw on a Supabase `error`. postgrest returns errors instead of throwing, so without this an outage looks like empty data.
- **Session and DB reads.** Read `cookies()`, the session or the DB only inside a Suspense boundary, a Server Action or a Route Handler. Error boundaries use `catchError` from `next/error`, so that `redirect()` and `notFound()` still work.
- **Server Actions:**
  - check the user with `getUser()` and validate the input;
  - return `{ ok: true, data } | { ok: false, error: <code> }`;
  - never send raw DB errors or display strings to the client.
- **UI strings.** Every UI string goes in both `src/i18n/dictionaries/vi.json` and `en.json`.
- **Motion:**
  - Use GSAP + ScrollTrigger + Lenis only, via `useGSAP`.
  - Every animation respects `prefers-reduced-motion`.
- **Theme.** There is no dark mode.
- **Commits:** `type(scope): one-line summary`, e.g. `feat(map): draw route segments`. Types: `feat`, `fix`, `docs`, `chore`, `refactor`. Branch names are free. This overrides any personal or global ticket-prefix commit rule.
- **Branches:** branch off `dev` and open PRs into `dev`. Never target `main`; it only gets release PRs from `dev`.
- **PRs:** put `Closes #<n>` in the description so the issue closes on merge.
- **Before pushing:** run `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` (`pnpm format` fixes formatting).
