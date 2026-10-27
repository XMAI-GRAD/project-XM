# project-xm

An online gallery of cultural heritage, made as a graduation project. It brings together heritage showcases, articles, and an interactive illustrated map, and ships as a website and an installable PWA in Vietnamese and English.

## Stack

- Next.js 16 (App Router, Cache Components)
- React 19, TypeScript
- Tailwind CSS 4
- Supabase (Auth and Postgres)
- Vercel
- pnpm

## Getting started

Requires Node 20.9+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. It redirects to `/vi`.

## Scripts

| Script              | What it does                     |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start the dev server             |
| `pnpm build`        | Production build                 |
| `pnpm lint`         | ESLint                           |
| `pnpm typecheck`    | TypeScript check                 |
| `pnpm format`       | Format all files with Prettier   |
| `pnpm format:check` | Check formatting without writing |

## Project structure

```
src/
  app/[lang]/     # routes, one tree per locale (vi, en)
  i18n/           # locale config and dictionaries
  content/        # hardcoded heritage, article and place data and images
  features/       # feature modules: auth, interactions, gallery, articles, map
  lib/supabase/   # Supabase clients
  components/ui/  # shared UI primitives
supabase/
  migrations/     # SQL migrations; the only way to change the DB schema
```

## Workflow

- Branches: `main` ← `dev` ← feature branches named `<issue>-<short-description>`.
- Every merge into `dev` or `main` goes through a pull request.
- Commit messages look like `[#<issue>] type(scope): short summary`.
- Work is tracked on the [project board](https://github.com/orgs/XMAI-GRAD/projects/1).
