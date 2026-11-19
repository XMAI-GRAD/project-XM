import assert from "node:assert/strict";
import { test } from "node:test";
import { nearbyLabel } from "./nearby.ts";

test("nearby distances keep one decimal in the page's locale", () => {
  assert.equal(nearbyLabel("Phố cổ", 1, "vi"), "Phố cổ (1,0 km)");
  assert.equal(nearbyLabel("Văn Miếu", 1.2, "vi"), "Văn Miếu (1,2 km)");
  assert.equal(nearbyLabel("Old Quarter", 0.4, "en"), "Old Quarter (0.4 km)");
});
