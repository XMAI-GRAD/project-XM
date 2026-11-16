import test from "node:test";
import assert from "node:assert/strict";
import { clipLine } from "./reference-geometry.mjs";
test("clips crossing roads without losing source direction", () => {
  assert.deepEqual(
    clipLine(
      [
        [-1, 0.5],
        [2, 0.5],
      ],
      [0, 0, 1, 1],
    ),
    [
      [
        [0, 0.5],
        [1, 0.5],
      ],
    ],
  );
  assert.deepEqual(
    clipLine(
      [
        [2, 0.5],
        [-1, 0.5],
      ],
      [0, 0, 1, 1],
    ),
    [
      [
        [1, 0.5],
        [0, 0.5],
      ],
    ],
  );
});
test("does not connect a road's separate visits through the crop", () => {
  const clipped = clipLine(
    [
      [0.5, 0.5],
      [2, 0.5],
      [2, 0.8],
      [0.5, 0.8],
    ],
    [0, 0, 1, 1],
  );
  assert.equal(clipped.length, 2);
  assert.deepEqual(clipped[0], [
    [0.5, 0.5],
    [1, 0.5],
  ]);
  assert.deepEqual(clipped[1], [
    [1, 0.8],
    [0.5, 0.8],
  ]);
});
test("rejects wholly outside and preserves inside lines", () => {
  assert.deepEqual(
    clipLine(
      [
        [-1, 0],
        [-1, 1],
      ],
      [0, 0, 1, 1],
    ),
    [],
  );
  const line = [
    [0.2, 0.3],
    [0.5, 0.6],
    [0.8, 0.9],
  ];
  assert.deepEqual(clipLine(line, [0, 0, 1, 1]), [line]);
});
