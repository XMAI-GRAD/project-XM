"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { Layer } from "@/content";
import { motionAllowed, rollUp, toggleRow, unroll } from "./explore-motion";
import s from "./page.module.css";

gsap.registerPlugin(useGSAP);

const tabId = (layer: Layer) => `explore-tab-${layer}`;
const panelId = (layer: Layer) => `explore-panel-${layer}`;
const panelOf = (layer: Layer) => document.getElementById(panelId(layer))!;

/** Folder tabs over the layer lists. The first list unrolls on arrival; selecting a tab rolls one list up and unrolls the next. */
export function ExploreTabs({
  tabs,
  label,
}: {
  tabs: { layer: Layer; name: string; content: ReactNode }[];
  label: string;
}) {
  // `active` is the highlighted tab; `shown` is the list on screen, which waits for the old one to leave.
  const [active, setActive] = useState(tabs[0].layer);
  const [shown, setShown] = useState(active);
  const root = useRef<HTMLDivElement>(null);
  const target = useRef(active);
  const lastShown = useRef(active);
  const leaving = useRef<gsap.core.Timeline | null>(null);
  const entering = useRef<gsap.core.Timeline | null>(null);
  const rowMotion = useRef<gsap.core.Timeline | null>(null);
  const fromHeight = useRef<number | undefined>(undefined);
  const arrived = useRef(false);

  useGSAP(
    () => {
      if (!arrived.current && motionAllowed()) {
        entering.current = unroll(panelOf(tabs[0].layer)).eventCallback(
          "onComplete",
          () => {
            arrived.current = true;
          },
        );
      }
      // Lifts the CSS that holds the rows back until this first paint (page.module.css).
      root.current!.dataset.arrived = "";
      // These start in event handlers, outside this context, so it can't revert them.
      return () => {
        leaving.current?.revert();
        leaving.current = null;
        rowMotion.current?.progress(1);
      };
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (lastShown.current === shown) return;
      lastShown.current = shown;
      arrived.current = true;
      if (motionAllowed())
        entering.current = unroll(panelOf(shown), fromHeight.current);
    },
    { scope: root, dependencies: [shown] },
  );

  const select = (next: Layer) => {
    if (next === target.current) return;
    target.current = next;
    setActive(next);
    if (!motionAllowed()) {
      setShown(next);
      return;
    }
    if (leaving.current) return; // when it ends, the exit goes to the latest target
    entering.current?.progress(1);
    rowMotion.current?.progress(1);
    const panel = panelOf(lastShown.current);
    leaving.current = rollUp(panel, () => {
      leaving.current = null;
      fromHeight.current = panel.offsetHeight;
      // Synchronous, so the cleared rows of the old list never get painted.
      flushSync(() => setShown(target.current));
    });
  };

  const onRowClick = (e: MouseEvent<HTMLDivElement>) => {
    const summary = (e.target as Element).closest("summary");
    if (!summary || !motionAllowed()) return; // the browser opens it natively
    e.preventDefault();
    rowMotion.current?.progress(1);
    rowMotion.current = toggleRow(
      summary.parentElement as HTMLDetailsElement,
      e.currentTarget,
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.layer === active);
    const to = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = tabs[to].layer;
    select(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div ref={root} className={s.root} onClick={onRowClick}>
      <div
        role="tablist"
        aria-label={label}
        className={s.tabs}
        onKeyDown={onKeyDown}
      >
        {tabs.map(({ layer, name }) => (
          <button
            key={layer}
            id={tabId(layer)}
            type="button"
            role="tab"
            aria-selected={layer === active}
            aria-controls={panelId(layer)}
            tabIndex={layer === active ? 0 : -1}
            className={s.tab}
            onClick={() => select(layer)}
          >
            {name}
          </button>
        ))}
      </div>
      {tabs.map(({ layer, content }) => (
        <div
          key={layer}
          id={panelId(layer)}
          role="tabpanel"
          aria-labelledby={tabId(layer)}
          hidden={layer !== shown}
          className={s.panel}
        >
          {content}
        </div>
      ))}
    </div>
  );
}
