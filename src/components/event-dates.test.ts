import assert from "node:assert/strict";
import { test } from "node:test";
import { eventDates } from "./event-dates.ts";

const labels = (date: string, endDate?: string) =>
  eventDates(date, endDate).map((d) => d.label);

test("single day keeps padding and year", () => {
  assert.deepEqual(labels("2027-02-07"), ["07/02/2027"]);
  assert.deepEqual(labels("2027-02-07", "2027-02-07"), ["07/02/2027"]);
});

test("range in one year shows the year once, at the end", () => {
  assert.deepEqual(labels("2026-11-14", "2026-11-23"), ["14/11", "23/11/2026"]);
  assert.deepEqual(labels("2027-01-09", "2027-02-07"), ["09/01", "07/02/2027"]);
});

test("range across years shows both years", () => {
  assert.deepEqual(labels("2026-12-30", "2027-01-02"), [
    "30/12/2026",
    "02/01/2027",
  ]);
});

test("each end keeps its ISO day for <time dateTime>", () => {
  assert.deepEqual(
    eventDates("2026-11-14", "2026-11-23").map((d) => d.iso),
    ["2026-11-14", "2026-11-23"],
  );
});
