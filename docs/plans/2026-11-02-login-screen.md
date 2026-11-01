# Login screen

Goal: style the real login page `/[lang]/login` in the site's cinematic look. Prototypes stay landing-only (`/[lang]/proto/a|b|c`).

Behavior is unchanged (SPEC → Routes, Auth): one "Continue with Google" button, `next` carried through, and an error message on `?error=auth`.

## Layout

Desktop, two columns below the root header:

- Left: a rounded image frame (16px radius) showing the first heritage's first image from `@/content`, captioned with its name and summary, the same as the landing hero frame.
- Right: the login panel, vertically centred.

Mobile (≤ 800px) stacks a shorter frame (4:3) above the panel.

## Panel

| Component     | Dictionary key             | Note                                                        |
| ------------- | -------------------------- | ----------------------------------------------------------- |
| Headline      | `login.title`              | Landing hero type scale                                     |
| Lead          | `login.lead`               | Why sign in: favorites and comments. Reading needs no login |
| Google button | `login.continueWithGoogle` | Light pill like the landing CTA, with the Google G mark     |
| Error         | `login.error`              | Only on `?error=auth`; `role="alert"`                       |
| Note          | `login.note`               | Placeholder until the team writes the privacy line          |
| Back link     | `login.back`               | To `/[lang]`                                                |

## Rules

- Strings live in both dictionaries; content is read through `@/content`.
- Styles use the global tokens in `globals.css` (`--ink`, `--paper`, `--dim`, `--line`, `--surface`).
- `searchParams` is read inside the existing Suspense boundary.
- Focus is visible on every control; nothing animates. No horizontal scroll at 375px.
