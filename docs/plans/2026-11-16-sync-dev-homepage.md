# Sync dev into the homepage branch

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
