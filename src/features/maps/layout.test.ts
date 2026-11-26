import assert from "node:assert/strict";
import { test } from "node:test";
import { mapFocusPoint, spreadMapPins } from "./layout.ts";

test("desktop selection leaves room for the pin beside its measured card", () => {
  const card = { left: 584, top: 130, right: 884, bottom: 584 };
  const point = mapFocusPoint({ width: 900, height: 600 }, card);
  assert.ok(point.x + 40 < card.left);
  assert.ok(point.y >= 72 && point.y <= 576);
});

test("a card docked below a narrow map does not displace the selected pin", () => {
  const size = { width: 360, height: 360 };
  assert.deepEqual(
    mapFocusPoint(size, { left: 0, top: 360, right: 360, bottom: 720 }),
    mapFocusPoint(size),
  );
  assert.equal(mapFocusPoint(size).x, 180);
});

test("a wide card leaves the selected pin above it and off the map edges", () => {
  const card = { left: 16, top: 330, right: 624, bottom: 584 };
  const point = mapFocusPoint({ width: 640, height: 600 }, card);
  assert.ok(point.y + 20 < card.top);
  assert.ok(point.x >= 32 && point.x <= 608);
});

test("small or temporarily zero-sized maps still have a finite focus target", () => {
  for (const size of [
    { width: 0, height: 0 },
    { width: 80, height: 60 },
  ]) {
    const point = mapFocusPoint(size);
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    assert.ok(point.x >= 0 && point.x <= size.width);
    assert.ok(point.y >= 0 && point.y <= size.height);
  }
});

test("isolated pins retain their geographic anchor, including near a group", () => {
  const points = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 0, y: 0 },
    { id: "z", x: 70, y: 0 },
  ];
  const placed = spreadMapPins(points);
  assert.deepEqual(placed.get("z"), { x: 70, y: 0 });
  assert.deepEqual(
    spreadMapPins([{ id: "single", x: 100, y: 50 }]).get("single"),
    { x: 100, y: 50 },
  );
  assert.equal(spreadMapPins([]).size, 0);
});

test("all twelve coincident pins have separate, reachable button positions", () => {
  const points = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    x: 200,
    y: 200,
  }));
  const placed = [...spreadMapPins(points).values()];
  assert.equal(placed.length, 12);
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      assert.ok(
        Math.hypot(placed[i].x - placed[j].x, placed[i].y - placed[j].y) >=
          63.99,
      );
    }
  }
});

test("pin spreading is stable across list order and panning", () => {
  const points = [
    { id: "c", x: 105, y: 110 },
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 140, y: 90 },
    { id: "d", x: 400, y: 400 },
  ];
  const original = spreadMapPins(points);
  assert.deepEqual(spreadMapPins([...points].reverse()), original);
  const translated = spreadMapPins(
    points.map((p) => ({ ...p, x: p.x + 180, y: p.y - 100 })),
  );
  for (const [id, point] of original) {
    assert.ok(Math.abs(translated.get(id)!.x - point.x - 180) < 0.001);
    assert.ok(Math.abs(translated.get(id)!.y - point.y + 100) < 0.001);
  }
  assert.deepEqual(points[0], { id: "c", x: 105, y: 110 });
});
