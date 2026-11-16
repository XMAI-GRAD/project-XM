/** Whether motion may play: false under `prefers-reduced-motion: reduce`. */
export const motionAllowed = () =>
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
