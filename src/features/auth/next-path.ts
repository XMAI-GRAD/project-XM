// Pure, so `pnpm test` can import it without Next or path aliases.

const base = new URL("http://n");

/**
 * A same-origin path to return to after login, else `fallback`.
 * Parsing (not prefix checks) also rejects `/\evil.com` and `/\t/evil.com`,
 * which browsers treat as `//evil.com`.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string,
): string {
  if (!next?.startsWith("/")) return fallback;
  const url = new URL(next, base);
  if (url.origin !== base.origin) return fallback;
  return url.pathname + url.search + url.hash;
}
