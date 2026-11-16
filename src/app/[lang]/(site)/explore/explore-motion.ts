import gsap from "gsap";

export const motionAllowed = () =>
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

const CLIPPED = "inset(0 0 100% 0)";
const SHOWN = "inset(0 0 0% 0)";

const rowsOf = (panel: Element) =>
  gsap.utils.toArray<HTMLElement>(":scope > ol > li, :scope > p", panel);
const contentOf = (rows: HTMLElement[]) =>
  rows.flatMap((row) => row.firstElementChild ?? []);

/**
 * Rows slide out from under their top hairline, one after another. The clip and
 * the slide share a duration and ease, so the text travels with the clip edge.
 */
export function unroll(panel: HTMLElement, fromHeight?: number) {
  const rows = rowsOf(panel);
  const content = contentOf(rows);
  const toHeight = panel.offsetHeight;
  const tl = gsap.timeline({
    defaults: { duration: 0.6, ease: "power3.out", stagger: 0.08 },
  });
  tl.fromTo(
    rows,
    { clipPath: CLIPPED },
    { clipPath: SHOWN, clearProps: "clipPath" },
    0,
  );
  if (content.length)
    tl.fromTo(
      content,
      { yPercent: -100 },
      { yPercent: 0, clearProps: "transform" },
      0,
    );
  if (fromHeight !== undefined && fromHeight !== toHeight)
    tl.fromTo(
      panel,
      { height: fromHeight },
      { height: toHeight, clearProps: "height", stagger: 0 },
      0,
    );
  return tl;
}

/** The exit for a tab change: shorter than `unroll`, last row first. */
export function rollUp(panel: HTMLElement, onDone: () => void) {
  const rows = rowsOf(panel);
  const content = contentOf(rows);
  const tl = gsap.timeline({
    defaults: {
      duration: 0.18,
      ease: "power2.in",
      stagger: { each: 0.025, from: "end" },
    },
    onComplete: () => {
      gsap.set([...rows, ...content], { clearProps: "clipPath,transform" });
      onDone();
    },
  });
  tl.fromTo(rows, { clipPath: SHOWN }, { clipPath: CLIPPED }, 0);
  if (content.length) tl.to(content, { yPercent: -100 }, 0);
  return tl;
}

const partsOf = (details: HTMLDetailsElement) => ({
  summary: details.querySelector("summary")!,
  reveal: details.querySelector<HTMLElement>("[data-reveal]")!,
  bar: details.querySelector<HTMLElement>("[data-bar]")!,
});

function collapse(
  tl: gsap.core.Timeline,
  details: HTMLDetailsElement,
  duration = 0.32,
  ease = "power2.inOut",
) {
  const { reveal, bar } = partsOf(details);
  details.dataset.closing = ""; // drops the open color now, not when the collapse ends
  tl.fromTo(
    reveal,
    { height: reveal.offsetHeight },
    { height: 0, duration, ease },
    0,
  );
  tl.fromTo(bar, { rotation: 90 }, { rotation: 0, duration, ease }, 0);
}

/** Closes `details` for good once its collapse has played. */
function finishCollapse(details: HTMLDetailsElement) {
  const { reveal, bar } = partsOf(details);
  details.open = false;
  delete details.dataset.closing;
  gsap.set([reveal, bar], { clearProps: "height,transform" });
}

/**
 * Opens or closes a row. Opening also collapses the row already open, keeps the
 * clicked header under the pointer, and scrolls just enough to show the button.
 */
export function toggleRow(details: HTMLDetailsElement, root: HTMLElement) {
  const tl = gsap.timeline();

  if (details.open) {
    collapse(tl, details);
    tl.eventCallback("onComplete", () => finishCollapse(details));
    return tl;
  }

  const { summary, reveal, bar } = partsOf(details);
  const name = details.getAttribute("name")!;
  const startTop = summary.getBoundingClientRect().top;
  const openRow = root.querySelector<HTMLDetailsElement>(
    `details[name="${name}"][open]`,
  );
  // A row left open on another tab has nothing to animate: `name` closes it.
  const other = openRow?.closest("[hidden]") ? null : openRow;

  // Without `name` the browser would close the other row before it can collapse.
  other?.removeAttribute("name");
  details.open = true;

  const openHeight = reveal.offsetHeight;
  const body = gsap.utils.toArray<HTMLElement>(":scope > * > *", reveal);
  const lost =
    other &&
    other.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING
      ? partsOf(other).reveal.offsetHeight
      : 0;
  // The page can't scroll above its top, so the header rises by whatever is left over.
  const pinnedTop = startTop - Math.max(0, lost - window.scrollY);
  const bottom = pinnedTop + summary.offsetHeight + openHeight + 24;
  const overflow = Math.max(0, bottom - window.innerHeight);
  const pin = { top: startTop };

  tl.fromTo(
    reveal,
    { height: 0 },
    { height: openHeight, duration: 0.5, ease: "power3.out" },
    0,
  );
  tl.fromTo(
    body,
    { opacity: 0, y: 14 },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power3.out",
      stagger: 0.07,
      clearProps: "opacity,transform",
    },
    0.1,
  );
  tl.fromTo(
    bar,
    { rotation: 0 },
    { rotation: 90, duration: 0.4, ease: "power3.out" },
    0,
  );
  // Same curve as the pin below: otherwise the scroll correction overshoots and the page bobs.
  if (other) collapse(tl, other, 0.5, "power3.out");
  // Added last, so it reads the layout after this tick's height changes.
  tl.to(
    pin,
    {
      top: pinnedTop - Math.min(overflow, Math.max(0, pinnedTop - 16)),
      duration: 0.5,
      ease: "power3.out",
      onUpdate: () => {
        const drift = summary.getBoundingClientRect().top - pin.top;
        if (Math.abs(drift) > 0.5)
          window.scrollBy({ top: drift, behavior: "instant" });
      },
    },
    0,
  );
  tl.eventCallback("onComplete", () => {
    gsap.set([reveal, bar], { clearProps: "height,transform" });
    if (other) {
      finishCollapse(other);
      other.setAttribute("name", name);
    }
  });
  return tl;
}
