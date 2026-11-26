import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { describe, it } from "node:test";

interface RecordedCall {
  kind: "to" | "fromTo" | "call";
  at: number;
  duration?: number;
  stagger?: number;
  fn?: () => void;
}

const timelines: {
  opts?: { onComplete?: () => void };
  calls: RecordedCall[];
  killed: boolean;
}[] = [];

const gsapMock = {
  registerPlugin() {},
  killTweensOf() {},
  set() {},
  timeline(opts?: { onComplete?: () => void }) {
    const record = { opts, calls: [] as RecordedCall[], killed: false };
    timelines.push(record);
    const api = {
      to(
        _target: unknown,
        vars: { duration?: number; stagger?: number },
        at = 0,
      ) {
        record.calls.push({
          kind: "to",
          at,
          duration: vars.duration,
          stagger: vars.stagger,
        });
        return api;
      },
      fromTo(
        _target: unknown,
        _from: unknown,
        to: { duration?: number; stagger?: number },
        at = 0,
      ) {
        record.calls.push({
          kind: "fromTo",
          at,
          duration: to.duration,
          stagger: to.stagger,
        });
        return api;
      },
      call(fn: () => void, _params?: unknown[], at = 0) {
        record.calls.push({ kind: "call", at, fn });
        return api;
      },
      kill() {
        record.killed = true;
      },
    };
    return api;
  },
};

(globalThis as Record<string, unknown>).__gsapMock = gsapMock;

const STUBS: Record<string, string> = {
  "gsap/MorphSVGPlugin": "export const MorphSVGPlugin = {};",
  "@/features/home/motion/gsap":
    "export const gsap = globalThis.__gsapMock; export const ScrollTrigger = { refresh() {} };",
  "./art":
    "export const detailGateBox = { x: 477.27, y: 1428.55, w: 260.94, h: 234.17 };",
};

// `@types/node` is v20; Node 24 provides synchronous `registerHooks`.
type RegisterHooks = (hooks: {
  resolve: (
    specifier: string,
    context: unknown,
    nextResolve: (specifier: string, context: unknown) => unknown,
  ) => unknown;
  load: (
    url: string,
    context: unknown,
    nextLoad: (url: string, context: unknown) => unknown,
  ) => unknown;
}) => void;

(nodeModule as unknown as { registerHooks: RegisterHooks }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier in STUBS) {
      return {
        url: `stub:///${encodeURIComponent(specifier)}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("stub:///")) {
      const key = decodeURIComponent(url.slice("stub:///".length));
      return {
        format: "module",
        source: STUBS[key],
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

const mod = await import("./gate-transition.ts");

function makeDomFixture() {
  const listeners = new Map<string, Set<(ev: unknown) => void>>();
  const winListeners = new Map<string, Set<(ev: unknown) => void>>();

  const attrs = new Map<string, string>([
    ["href", "/vi/explore/van-mieu-quoc-tu-giam"],
    [
      "data-gate-hero-src",
      "/_next/image?url=%2Fpoints%2Fvan-mieu%2Fdetail.jpg&w=3840&q=75",
    ],
    [
      "data-gate-hero-srcset",
      "/_next/image?url=%2Fpoints%2Fvan-mieu%2Fdetail.jpg&w=750&q=75 750w",
    ],
    ["data-gate-hero-sizes", "(max-width: 48rem) 100vw, 50vw"],
  ]);

  const photo = {
    getAttribute(name: string) {
      if (name === "data-gate-nw") return "2400";
      if (name === "data-gate-nh") return "1600";
      return null;
    },
    getBoundingClientRect() {
      return { left: 100, top: 200, width: 260, height: 234 } as DOMRect;
    },
  };

  const gate = {
    querySelector(sel: string) {
      if (sel === "[data-gate-photo]") return photo;
      if (sel === "[data-gate-svg]") return {};
      if (sel === "[data-gate-frame]") return {};
      if (sel === "[data-gate-name]") return {};
      if (sel === "[data-gate-mask]")
        return { dataset: {}, getAttribute: () => null };
      if (sel === "[data-gate-mask] path")
        return { dataset: {}, getAttribute: () => "" };
      return null;
    },
  };

  const link = {
    dataset: { gateSlug: "van-mieu-quoc-tu-giam" },
    target: "",
    getAttribute: (name: string) => attrs.get(name) ?? null,
    closest(sel: string) {
      if (sel === "a[data-gate-link]") return link;
      if (sel === "[data-explore-gate]") return gate;
      return null;
    },
  };

  const scope = {
    contains: (el: unknown) => el === link,
    querySelectorAll: (sel: string) =>
      sel === "[data-explore-gate]" ? [gate] : [],
    addEventListener(type: string, fn: (ev: unknown) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: (ev: unknown) => void) {
      listeners.get(type)?.delete(fn);
    },
    dispatch(type: string, ev: unknown) {
      for (const fn of listeners.get(type) ?? []) fn(ev);
    },
  };

  const preloadedImages: { src: string; srcset: string; sizes: string }[] = [];
  class FakeImage {
    src = "";
    srcset = "";
    sizes = "";
    constructor() {
      preloadedImages.push(this);
    }
  }

  (globalThis as Record<string, unknown>).window = {
    innerWidth: 1440,
    innerHeight: 900,
    addEventListener(type: string, fn: (ev: unknown) => void) {
      if (!winListeners.has(type)) winListeners.set(type, new Set());
      winListeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: (ev: unknown) => void) {
      winListeners.get(type)?.delete(fn);
    },
  };
  (globalThis as Record<string, unknown>).Image = FakeImage;

  return { scope, link, preloadedImages };
}

describe("gate-transition timing and preloading", () => {
  it("keeps exit handoff under 250 ms and schedules push on the timeline instead of waiting on onComplete", () => {
    const timing = mod.GATE_EXIT_TIMING;
    assert.ok(
      timing.handoffAt > 0 && timing.handoffAt <= 0.25,
      `expected handoffAt <= 0.25s, got ${timing.handoffAt}`,
    );

    timelines.length = 0;
    const { scope, link, preloadedImages } = makeDomFixture();
    const pushed: { href: string; scroll?: boolean }[] = [];
    const prefetched: string[] = [];
    const router = {
      push: (href: string, opts?: { scroll?: boolean }) =>
        pushed.push({ href, ...opts }),
      prefetch: (href: string) => prefetched.push(href),
    };

    const detach = mod.attachGateTransition({
      scope: scope as unknown as HTMLElement,
      router: router as unknown as Parameters<
        typeof mod.attachGateTransition
      >[0]["router"],
    });

    // Hover warms both route prefetch and destination hero image once.
    scope.dispatch("pointerover", { target: link });
    scope.dispatch("pointerdown", { target: link });
    assert.deepEqual(prefetched, ["/vi/explore/van-mieu-quoc-tu-giam"]);
    assert.equal(preloadedImages.length, 1);
    assert.match(preloadedImages[0].srcset, /detail\.jpg/);
    assert.equal(preloadedImages[0].sizes, "(max-width: 48rem) 100vw, 50vw");

    // Click starts exit timeline and schedules handoff at timing.handoffAt (not onComplete).
    let prevented = false;
    scope.dispatch("click", {
      target: link,
      defaultPrevented: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
    assert.equal(timelines.length, 1);
    assert.equal(timelines[0].opts?.onComplete, undefined);

    const handoffCall = timelines[0].calls.find((c) => c.kind === "call");
    assert.ok(
      handoffCall,
      "expected timeline.call() to schedule navigation handoff",
    );
    assert.equal(handoffCall.at, timing.handoffAt);

    // Execute the scheduled handoff callback and confirm handoff state + router.push.
    handoffCall.fn!();
    assert.deepEqual(pushed, [
      { href: "/vi/explore/van-mieu-quoc-tu-giam", scroll: false },
    ]);
    assert.equal(mod.consumeGateScrollReset(), true);
    assert.equal(mod.consumeGateScrollReset(), false);
    const handoff = mod.takeGateHandoff("van-mieu-quoc-tu-giam");
    assert.ok(handoff);
    assert.equal(handoff.naturalWidth, 2400);
    assert.equal(mod.takeGateHandoff("van-mieu-quoc-tu-giam"), null);

    detach();
  });

  it("does not intercept modified clicks (meta/ctrl/non-primary button)", () => {
    timelines.length = 0;
    const { scope, link } = makeDomFixture();
    const router = { push() {}, prefetch() {} };

    const detach = mod.attachGateTransition({
      scope: scope as unknown as HTMLElement,
      router: router as unknown as Parameters<
        typeof mod.attachGateTransition
      >[0]["router"],
    });

    let prevented = false;
    scope.dispatch("click", {
      target: link,
      defaultPrevented: false,
      button: 0,
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, false);
    assert.equal(timelines.length, 0);

    detach();
  });

  it("clampGateRect preserves partially visible bottom gates without shifting them up, and clamps fully offscreen rects", () => {
    const viewport = { width: 1440, height: 800 };
    const partialBottom = { left: 920, top: 687, width: 198, height: 178 };
    assert.deepEqual(mod.clampGateRect(partialBottom, viewport), partialBottom);

    const fullyBelow = { left: 920, top: 900, width: 198, height: 178 };
    assert.deepEqual(mod.clampGateRect(fullyBelow, viewport), {
      left: 920,
      top: 622,
      width: 198,
      height: 178,
    });
  });
});
