import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesMapSearch, normalizeMapSearch } from "./search.ts";

const place = {
  name: "Hoàng thành Thăng Long",
  address: "19C Hoàng Diệu",
  code: "d01",
};

test("matches Vietnamese text with or without accents, including Đ", () => {
  assert.equal(normalizeMapSearch("  ĐỨC  "), "duc");
  assert.ok(matchesMapSearch(place, "HOANG THANH"));
  assert.ok(matchesMapSearch(place, "Hoàng thành"));
  assert.ok(matchesMapSearch({ ...place, name: "Bún thang Bà Đức" }, "ba duc"));
});

test("matches address, code, and words separated by extra whitespace", () => {
  assert.ok(matchesMapSearch(place, "19c hoang dieu"));
  assert.ok(matchesMapSearch(place, "D01"));
  assert.ok(matchesMapSearch(place, "  thang  19C  "));
});

test("empty search includes places; unmatched terms exclude them", () => {
  assert.ok(matchesMapSearch(place, " \t "));
  assert.equal(matchesMapSearch(place, "hoang coffee"), false);
  assert.equal(matchesMapSearch(place, "ngu xa"), false);
});
