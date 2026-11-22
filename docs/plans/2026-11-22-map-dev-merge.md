# Map integration with dev

## Authorization and inputs

The owner requested a local merge followed by a remote PR. This supersedes the
earlier local-only scope of the map implementation plans. Work remains on
`feat/map-v2`; the PR targets `dev` and closes #41, already assigned to BuiVuBaoMinh.
Remote review and merging remain with the project maintainers.

- Saved the latest theme tabs, controls and legend work as `4e48cec`.
- Fetched and merged `origin/dev` at `8f8c30e` without conflicts.
- Incoming changes include the revised home/about artwork, home motion, footer,
  theme-specific Explore routes and updated place photographs/content.

## Integration

Preserved dev's changes, including its SPEC updates. Map detail links now use the
shared `pointHref` helper to open `/[lang]/explore/<layer>/<slug>` directly.
The branch retains its existing Next.js/eslint-config-next 16.4.6 upgrade.
Normalized Windows working-copy line endings without changing those Git blobs;
formatted seven map QA JSON files so the repository-wide formatting check passes.

## Validation

- Repository-wide formatting and ESLint, TypeScript and production build pass.
- All 61 tests pass. Windows requires explicit test-file enumeration because the
  single-quoted package-script glob discovers no tests under cmd.exe.
- Build generates 103 pages, with the existing 109 English-content fallbacks.
- Headless Edge: all 48 destination/route cases across VI/EN, desktop/mobile and
  normal/reduced motion; theme tags; search; tool feedback; enlarged legend.
- All 24 localized map detail links use canonical paths. Actual navigation to
  one point in each layer, Back to the map, the header Explore menu and homepage
  loads pass in both languages. No browser page errors.

Navigation evidence: [results](../../research/design/evidence/map-merge/navigation-results.json).
