// Shared Server Action return shape (SPEC Part 2 → API contract).
export type ActionError =
  | "unauthenticated"
  | "invalid_input"
  | "not_found"
  | "rate_limited"
  | "unknown";

export type Result<T = void> =
  { ok: true; data: T } | { ok: false; error: ActionError };
