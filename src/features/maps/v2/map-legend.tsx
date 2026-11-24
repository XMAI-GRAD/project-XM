"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { gsap, MOTION, useGSAP } from "@/features/home/motion/gsap";
import s from "./map.module.css";

export interface MapLegendControls {
  close: () => boolean;
}

/** One image changes size and position; no thumbnail remains behind it. */
export function MapLegend({
  ref,
  id,
  label,
  closeLabel,
}: {
  ref: Ref<MapLegendControls>;
  id: string;
  label: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousBounds = useRef<DOMRect | null>(null);
  const state = useRef({ open: false, moving: false });

  function change(next: boolean) {
    if (state.current.open === next) return state.current.moving;
    previousBounds.current = root.current!.getBoundingClientRect();
    state.current = { open: next, moving: true };
    setOpen(next);
    return true;
  }

  useImperativeHandle(ref, () => ({ close: () => change(false) }));

  useGSAP(
    () => {
      const panel = root.current!;
      const media = gsap.matchMedia();
      media.add(
        { motion: MOTION, reduced: "(prefers-reduced-motion: reduce)" },
        (context) => {
          const from = previousBounds.current;
          previousBounds.current = null;
          let movement: gsap.core.Tween | undefined;
          const finish = () => {
            state.current.moving = false;
            delete panel.dataset.moving;
          };
          if (from && context.conditions?.motion) {
            const to = panel.getBoundingClientRect();
            panel.dataset.moving = "true";
            // Invert the new layout to the previous on-screen rectangle, then
            // animate that same element into its new size. Interruptions start
            // from the currently painted rectangle, including partial motion.
            movement = gsap.fromTo(
              panel,
              {
                x: from.left - to.left,
                y: from.top - to.top,
                scaleX: from.width / to.width,
                scaleY: from.height / to.height,
                transformOrigin: "0 0",
              },
              {
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                duration: open ? 0.38 : 0.3,
                ease: "power3.inOut",
                clearProps: "transform,transformOrigin",
                onComplete: finish,
              },
            );
          } else finish();
          if (from)
            (open ? closeButton.current : trigger.current)?.focus({
              preventScroll: true,
            });

          // A new viewport/card layout must not leave an old inverse transform
          // attached to a responsive position after resizing.
          const container = panel.parentElement!;
          let width = container.clientWidth;
          let height = container.clientHeight;
          const resize = new ResizeObserver(() => {
            if (
              width !== container.clientWidth ||
              height !== container.clientHeight
            ) {
              width = container.clientWidth;
              height = container.clientHeight;
              movement?.progress(1);
            }
          });
          resize.observe(container);

          const button = closeButton.current;
          const icon = button?.querySelector("img");
          const removers: (() => void)[] = [];
          if (button && icon && context.conditions?.motion) {
            let hovered = false;
            let pressed = false;
            const feedback = context.add("feedback", () => {
              gsap.to(icon, {
                scale: pressed
                  ? 0.9
                  : hovered || button.matches(":focus-visible")
                    ? 1.08
                    : 1,
                duration: pressed ? 0.08 : 0.16,
                ease: "power2.out",
                overwrite: true,
              });
            });
            const listen = (name: string, handler: (event: Event) => void) => {
              button.addEventListener(name, handler);
              removers.push(() => button.removeEventListener(name, handler));
            };
            listen("pointerenter", (event) => {
              hovered = (event as PointerEvent).pointerType !== "touch";
              feedback();
            });
            for (const name of ["pointerleave", "pointercancel"])
              listen(name, () => {
                hovered = pressed = false;
                feedback();
              });
            for (const name of ["pointerdown", "pointerup"])
              listen(name, () => {
                pressed = name === "pointerdown";
                feedback();
              });
            for (const name of ["keydown", "keyup"])
              listen(name, (event) => {
                if (!["Enter", " "].includes((event as KeyboardEvent).key))
                  return;
                pressed = name === "keydown";
                feedback();
              });
            listen("focus", () => feedback());
            listen("blur", () => {
              pressed = false;
              feedback();
            });
            feedback();
          }
          return () => {
            resize.disconnect();
            removers.forEach((remove) => remove());
            delete panel.dataset.moving;
          };
        },
        root,
      );
      return () => media.revert();
    },
    { scope: root, dependencies: [open], revertOnUpdate: true },
  );

  return (
    <div
      ref={root}
      id={id}
      className={open ? s.legendPopover : s.legend}
      data-map-legend=""
      data-expanded={open}
      role="region"
      aria-label={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id={`${id}-artwork`}
        src="/maps/v2/legend.svg"
        alt={open ? label : ""}
        data-legend-artwork=""
      />
      <button
        ref={trigger}
        className={s.legendExpand}
        type="button"
        hidden={open}
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-artwork`}
        onClick={() => change(true)}
      />
      {open && (
        <button
          ref={closeButton}
          className={s.legendClose}
          type="button"
          aria-label={closeLabel}
          onClick={() => change(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maps/v2/card-close.svg" alt="" />
        </button>
      )}
    </div>
  );
}
