import type { CSSProperties } from "react";
import type { ArtBox } from "./art";

/** Puts a piece at its comp position: pair it with the `.at` class of home.module.css. */
export const at = (box: ArtBox): CSSProperties =>
  ({ "--x": box.x, "--y": box.y, "--w": box.w }) as CSSProperties;
