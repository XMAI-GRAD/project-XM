import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCommentBody, parseCommentId } from "./comment-input.ts";

test("rejects empty, whitespace-only, too long and non-string bodies", () => {
  for (const raw of [
    "",
    "   ",
    "\n\t \r\n",
    " 　", // nbsp + ideographic space
    "a".repeat(1001),
    " " + "😀".repeat(1001) + " ",
    null,
    undefined,
    42,
    {},
  ])
    assert.equal(parseCommentBody(raw), null, JSON.stringify(raw));
});

test("trims and accepts 1 to 1000 code points", () => {
  assert.equal(parseCommentBody("  hi  "), "hi");
  assert.equal(parseCommentBody("x"), "x");
  assert.equal(parseCommentBody("a".repeat(1000)), "a".repeat(1000));
  // 1000 emoji are 2000 UTF-16 units but 1000 code points, like char_length().
  assert.equal(parseCommentBody("😀".repeat(1000)), "😀".repeat(1000));
  assert.equal(parseCommentBody(`  ${"é".repeat(1000)}\n`), "é".repeat(1000));
  assert.equal(parseCommentBody("dòng 1\ndòng 2"), "dòng 1\ndòng 2");
});

test("accepts only positive safe integer ids", () => {
  assert.equal(parseCommentId(1), 1);
  assert.equal(parseCommentId(2 ** 40), 2 ** 40);
  for (const raw of [0, -1, 1.5, NaN, Infinity, 2 ** 53, "1", null, undefined])
    assert.equal(parseCommentId(raw), null, String(raw));
});
