import assert from "node:assert/strict";
import { test } from "node:test";
import { fold, search } from "./search.ts";

const items = [{ name: "Hồ Hoàn Kiếm" }, { name: "Đền Ngọc Sơn" }];
const names = (q: string) => search(items, q).map((i) => i.name);

test("fold drops case, diacritics and extra spaces", () => {
  assert.equal(fold("  Đền   NGỌC Sơn "), "den ngoc son");
});

test("search ignores case and diacritics", () => {
  assert.deepEqual(names("ho hoan"), ["Hồ Hoàn Kiếm"]);
  assert.deepEqual(names("đền"), ["Đền Ngọc Sơn"]);
  assert.deepEqual(names("DEN NGOC"), ["Đền Ngọc Sơn"]);
});

test("an empty query or no match returns nothing", () => {
  assert.deepEqual(names("   "), []);
  assert.deepEqual(names("pho"), []);
});
