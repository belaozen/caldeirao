// Minimal browser stand-in so the game modules can run under Node.
// Every element lookup must match a real id in index.html, which catches markup/code drift.
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const noop = () => {};
const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop: noop }) } as Record<string, unknown>, {
  get: (o, k: string) => o[k] ?? noop,
  set: (o, k: string, v) => ((o[k] = v), true),
});

type FakeElement = Record<string, unknown> & { events: Record<string, (e?: unknown) => void> };
const elements: Record<string, FakeElement> = {};
function element(id: string) {
  if (!html.includes(`id="${id}"`)) throw new Error("Missing real DOM id " + id);
  return (elements[id] ??= {
    style: {},
    innerHTML: "",
    textContent: "",
    hidden: false,
    open: false,
    events: {},
    classList: { add: noop, remove: noop },
    setAttribute: noop,
    focus: noop,
    getContext: () => ctx,
    addEventListener(this: FakeElement, type: string, fn: (e?: unknown) => void) {
      this.events[type] = fn;
    },
    showModal(this: FakeElement) {
      this.open = true;
    },
    close(this: FakeElement) {
      this.open = false;
      this.events.close?.();
    },
  });
}

Object.assign(globalThis, {
  document: {
    getElementById: element,
    activeElement: { tagName: "CANVAS" },
    addEventListener: noop,
    hidden: false,
  },
  window: { addEventListener: noop },
  location: { search: "" },
  requestAnimationFrame: noop,
});
