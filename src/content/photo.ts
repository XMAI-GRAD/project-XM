import type { Photo } from "./index.ts";

/** Pick the hero photo for a point detail page: a dedicated detail photo (the
 *  second real image) when present, otherwise the cover (first real image). */
export function detailPhoto(images: readonly Photo[]): Photo | undefined {
  const real = images.filter((image) => !image.temporary);
  return real[1] ?? real[0];
}
