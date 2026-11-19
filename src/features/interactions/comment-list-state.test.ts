import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendOptimisticComment,
  type DisplayComment,
} from "./comment-list-state.ts";

const author = { id: "u1", displayName: "Minh", avatarUrl: null };

const baseComment: DisplayComment = {
  id: 10,
  body: "Chiều thu trên cầu rất lộng gió.",
  createdAt: "2026-11-18T10:00:00.000Z",
  formattedDate: "18 thg 11, 2026 17:00",
  author: { id: "u2", displayName: "Lan", avatarUrl: null },
  replies: [
    {
      id: 11,
      body: "Đúng rồi, tầm 5 giờ chiều đẹp nhất.",
      createdAt: "2026-11-18T11:00:00.000Z",
      formattedDate: "18 thg 11, 2026 18:00",
      author: { id: "u3", displayName: "Huy", avatarUrl: null },
      replies: [],
    },
  ],
};

describe("appendOptimisticComment", () => {
  it("prepends a pending top-level comment to the top of the list", () => {
    const next = appendOptimisticComment([baseComment], {
      tempId: -1,
      body: "Ký ức mới",
      createdAt: "2026-11-19T06:00:00.000Z",
      formattedDate: "19 thg 11, 2026 13:00",
      author,
    });
    assert.equal(next.length, 2);
    assert.equal(next[0].id, -1);
    assert.equal(next[0].pending, true);
    assert.equal(next[0].body, "Ký ức mới");
    assert.deepEqual(next[0].replies, []);
    assert.equal(next[1].id, 10);
  });

  it("handles an empty list when adding a top-level comment", () => {
    const next = appendOptimisticComment([], {
      tempId: -1,
      body: "Người đầu tiên",
      createdAt: "2026-11-19T06:00:00.000Z",
      formattedDate: "19 thg 11, 2026 13:00",
      author,
    });
    assert.equal(next.length, 1);
    assert.equal(next[0].pending, true);
  });

  it("appends a pending reply oldest-first under its top-level parent", () => {
    const next = appendOptimisticComment([baseComment], {
      tempId: -2,
      body: "Mình cũng thích đi bộ qua đó.",
      parentId: 10,
      createdAt: "2026-11-19T06:05:00.000Z",
      formattedDate: "19 thg 11, 2026 13:05",
      author,
    });
    assert.equal(next.length, 1);
    assert.equal(next[0].replies.length, 2);
    assert.equal(next[0].replies[0].id, 11);
    assert.equal(next[0].replies[1].id, -2);
    assert.equal(next[0].replies[1].pending, true);
    // Does not mutate the original comment or replies array.
    assert.equal(baseComment.replies.length, 1);
  });

  it("ignores replies targeting an unknown or non-top-level parent id", () => {
    const list = [baseComment];
    const next = appendOptimisticComment(list, {
      tempId: -3,
      body: "Không khớp",
      parentId: 11,
      createdAt: "2026-11-19T06:05:00.000Z",
      formattedDate: "19 thg 11, 2026 13:05",
      author,
    });
    assert.equal(next, list);
  });
});
