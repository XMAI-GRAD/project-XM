import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detailPhoto } from "./photo.ts";

const photo = (src: string, temporary?: boolean) => ({
  src,
  temporary,
  width: 2400,
  height: 1485,
  alt: { vi: "Ảnh", en: "Photo" },
});

describe("detailPhoto", () => {
  it("picks the dedicated detail photo (second real image) when present", () => {
    const cover = photo("/points/a/cover.jpg");
    const detail = photo("/points/a/detail.jpg");
    assert.equal(detailPhoto([cover, detail]), detail);
  });

  it("falls back to the first real image when only a cover exists", () => {
    const cover = photo("/points/a/cover.jpg");
    assert.equal(detailPhoto([cover]), cover);
  });

  it("skips temporary stand-ins", () => {
    const temp = photo("/points/a/temp.jpg", true);
    const real = photo("/points/a/cover.jpg");
    assert.equal(detailPhoto([temp, real]), real);
    assert.equal(detailPhoto([temp]), undefined);
  });
});
