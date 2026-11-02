// Pure, so `pnpm test` can import it without Next or path aliases.

export const maxCommentLength = 1000;

/** The trimmed body if it is 1–1000 code points (like char_length()), else null. */
export function parseCommentBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const body = raw.trim();
  const length = [...body].length;
  return length >= 1 && length <= maxCommentLength ? body : null;
}

/** A reply's parent id from a form field: null when empty (top-level), undefined when invalid. */
export function parseParentId(raw: unknown): number | null | undefined {
  if (raw === null || raw === "") return null;
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return undefined;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : undefined;
}

/** A positive integer comment id, else null. */
export function parseCommentId(raw: unknown): number | null {
  return Number.isSafeInteger(raw) && (raw as number) > 0
    ? (raw as number)
    : null;
}
