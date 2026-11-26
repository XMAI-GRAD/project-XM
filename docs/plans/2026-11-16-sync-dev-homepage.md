# Sync dev into the homepage branch

> **Superseded implementation decision, 17 November:** the owner requested that
> the remote SVG homepage be active, preserving only our opening scroll/morph.
> That correction is implemented. See [the current migration record](../../research/design/2026-11-17-svg-homepage-migration.md).
> The merge and validation details below describe the earlier state, not the
> current homepage architecture.

Requested: update local dev from the remote and merge it into feat/homepage-design.
Remote commit: `edc7847` — `chore: svg --> tsx (#61)`.

The branches independently implemented the same homepage. The merge preserves
the current homepage as the active route, including its responsive layout,
interactive menu, accessible entry/skip links and category links. The remote's
generated SVG components and alternate section implementation are retained for
future integration; this merge does not switch the active homepage to them.

Conflict resolutions:

- Adopt the remote document-only root layout and `(site)` route group for other
  pages. Remove the obsolete conditional SiteFrame component. Public URLs stay the
  same. Home supplies its own main landmark and uses the new shared footer.
- Keep the current homepage CSS and rendering. Combine both YAML content schemas
  and validators; adopt named role fields and preserve the existing translations.
- Retain both sets of dictionary additions. Use the remote's equivalent optional
  className handling for shared header search.
- Retain the remote SVG sources, generation scripts, typed art components, extra
  color tokens and shared footer implementation.

Before changing branches, the 18 uncommitted scroll-morph files were copied with
SHA256 hashes to `D:\XMAI GRAD\tmp\sync-dev-2026-11-16` and saved in Git stash
`9dede3e1a56ea4fb2dada4d4b34caf4dbd1cb031`. They are restored after the merge commit,
remaining uncommitted. The stash is retained as a backup.

Local dev fast-forwarded from `fcccc52` to `edc7847`. Initial lint and TypeScript
checks pass for the resolved merge. Final validation after restoring the scroll
morph is recorded below. No push or PR is requested. SPEC.md is preserved.

## Final validation

Merge commit: `46a83e7`. Local dev and origin/dev both point to `edc7847`, which is
an ancestor of the feature branch. All merge/stash conflicts are resolved; the
original scroll-morph work is restored and remains unstaged/uncommitted.

- Lint, TypeScript, all 38 existing tests, and production build pass. The build
  generates 61 pages and reports 126 existing/combined English content fallbacks.
- Twelve homepage interaction groups, eleven motion groups and four lifecycle/
  touch groups pass in production Edge with no JavaScript page errors. These cover
  map navigation across the new route group, search, category links, menus,
  repeated locales, resizing, reverse scroll, reduced motion and emulated touch.
- A header-hash reload regression surfaced under the new root layout: browser
  scroll anchoring followed the transforming entry link. Scoped
  `overflow-anchor: none` to the motion-enabled homepage; the reload test now passes.
  This small integration fix remains part of the uncommitted scroll-morph work.
- Changed/resolved code formatting passes. Upstream Illustrator SVG exports retain
  their original whitespace; five trailing-whitespace warnings in those raw source
  files were not rewritten. The earlier repository-wide formatting debt remains.
- SPEC.md still has SHA256
  `5477896223E52137BD3B547DEF84C15EA471330E9FD9751AC883E15B3C4C2DC6`.

The Git stash and external file backup remain available. No remote branch was
pushed, and no PR was opened.
