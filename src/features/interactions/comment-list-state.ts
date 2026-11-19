// Pure, so `pnpm test` can import it without Next or path aliases.

export interface DisplayComment {
  id: number;
  body: string;
  createdAt: string;
  formattedDate: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  replies: DisplayComment[];
  pending?: boolean;
}

export interface OptimisticCommentDraft {
  tempId: number;
  body: string;
  parentId?: number;
  createdAt: string;
  formattedDate: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
}

/**
 * Merges a pending top-level comment (prepended newest-first) or a one-level
 * reply (appended oldest-first under its parent) into the rendered list.
 * Unknown parent ids leave the list unchanged.
 */
export function appendOptimisticComment(
  list: DisplayComment[],
  draft: OptimisticCommentDraft,
): DisplayComment[] {
  const entry: DisplayComment = {
    id: draft.tempId,
    body: draft.body,
    createdAt: draft.createdAt,
    formattedDate: draft.formattedDate,
    author: draft.author,
    replies: [],
    pending: true,
  };
  if (draft.parentId === undefined) {
    return [entry, ...list];
  }
  let matched = false;
  const next = list.map((top) => {
    if (top.id !== draft.parentId) return top;
    matched = true;
    return { ...top, replies: [...top.replies, entry] };
  });
  return matched ? next : list;
}
