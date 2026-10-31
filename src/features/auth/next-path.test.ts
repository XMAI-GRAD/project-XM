import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./next-path.ts";

test("rejects anything that isn't a same-origin path", () => {
  for (const next of [
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "",
    null,
    undefined,
  ])
    assert.equal(safeNextPath(next, "/vi"), "/vi", String(next));
});

test("keeps a same-origin path with query and hash", () => {
  assert.equal(safeNextPath("/en/map?x=1#pin", "/vi"), "/en/map?x=1#pin");
});
