"use client";

import { gsap } from "@/features/home/motion/gsap";

/*
 * The About page's colour pour: a colour poured over some text in a circle growing
 * from a point, while the pointer is over any of its triggers (or a switch holds it
 * on), and shrinking back into the point after.
 */
const POUR = 0.5;
const DRAIN = 0.4;
/** A moment before draining, so moving between triggers doesn't. */
const DRAIN_AFTER = 0.08;

export type Point = { x: number; y: number };

/** The middle of an element, or of several together, on screen. */
export function middle(...els: Element[]): Point {
  const boxes = els.map((el) => el.getBoundingClientRect());
  const left = Math.min(...boxes.map((b) => b.left));
  const right = Math.max(...boxes.map((b) => b.right));
  const top = Math.min(...boxes.map((b) => b.top));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

/**
 * Pours `colour` over the elements in `over`, from the point `from` gives. Each gets a
 * copy of itself in the colour, laid over it and masked to the circle, shut at first.
 * A heading line is a positioned block trimmed to its capitals (`trim`); a run of
 * text inside a line is an inline span, which is positioned for its copy here.
 *
 * `check(forget)` brings it to what it should be: full while hovered or while `lit()`
 * says so, drained otherwise; `forget` drops the hover first, for a switch going off
 * under the pointer. `destroy()` takes it all away.
 */
export function pourOver({
  over,
  colour,
  from,
  triggers,
  lit = () => false,
  trim = false,
}: {
  over: HTMLElement[];
  colour: string;
  from: () => Point;
  triggers: Element[];
  lit?: () => boolean;
  trim?: boolean;
}) {
  const pours = over.map((el) => {
    const copy = document.createElement("span");
    copy.setAttribute("aria-hidden", "true");
    copy.append(...[...el.childNodes].map((n) => n.cloneNode(true)));
    copy.querySelectorAll(".sr-only").forEach((n) => n.remove());
    Object.assign(copy.style, {
      position: "absolute",
      inset: "0",
      color: colour,
      pointerEvents: "none",
      clipPath: "circle(0px)",
      // A run's spaces at its ends would fold away at the start of the copy's own
      // line and shift its letters; a heading line has none there.
      ...(trim
        ? { whiteSpace: "nowrap", textBox: "cap alphabetic" }
        : { whiteSpace: "pre" }),
    });
    const positioned = getComputedStyle(el).position !== "static";
    if (!positioned) el.style.position = "relative";
    el.append(copy);
    return { el, copy, positioned, x: 0, y: 0 };
  });
  const circle = { r: 0 };
  const mask = () =>
    pours.forEach((p) => {
      p.copy.style.clipPath = `circle(${circle.r}px at ${p.x}px ${p.y}px)`;
    });
  // The point, on each; and how far the circle has to grow to cover them all, with
  // their accents.
  const anchor = () => {
    const at = from();
    let reach = 0;
    pours.forEach((p) => {
      const box = p.el.getBoundingClientRect();
      p.x = at.x - box.left;
      p.y = at.y - box.top;
      const h = box.height;
      const w = box.width;
      // An inline run's copy sets its one line as tall as the run's own box, so
      // its letters sit where the run's do.
      if (!trim) p.copy.style.lineHeight = `${h}px`;
      [
        [0, -0.7 * h],
        [w, -0.7 * h],
        [0, 1.45 * h],
        [w, 1.45 * h],
      ].forEach(([x, y]) => {
        reach = Math.max(reach, Math.hypot(x - p.x, y - p.y));
      });
    });
    return reach;
  };

  let hovered = false;
  let full = false;
  const update = () => {
    const want = lit() || hovered;
    if (want === full) return;
    full = want;
    // From where it is, if still growing or shrinking back.
    const reach = anchor();
    gsap.to(circle, {
      r: want ? reach : 0,
      duration: want ? POUR : DRAIN,
      ease: want ? "power1.inOut" : "power2.inOut",
      overwrite: true,
      onUpdate: mask,
    });
  };
  const drain = gsap.delayedCall(DRAIN_AFTER, update).pause();
  const enter = () => {
    hovered = true;
    drain.pause();
    update();
  };
  const leave = () => {
    hovered = false;
    drain.restart(true);
  };
  triggers.forEach((t) => {
    t.addEventListener("pointerenter", enter);
    t.addEventListener("pointerleave", leave);
  });

  return {
    check(forget = false) {
      if (forget) {
        hovered = false;
        drain.pause();
      }
      update();
    },
    destroy() {
      drain.kill();
      triggers.forEach((t) => {
        t.removeEventListener("pointerenter", enter);
        t.removeEventListener("pointerleave", leave);
      });
      gsap.killTweensOf(circle);
      pours.forEach((p) => {
        p.copy.remove();
        if (!p.positioned) p.el.style.removeProperty("position");
      });
    },
  };
}
