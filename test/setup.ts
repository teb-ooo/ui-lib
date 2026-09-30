import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { getViewportWidth, resetViewport } from "./cmdk/viewport";

/** matchMedia that answers width queries from the test's viewport (px, and rem at 16px), for the cmdk tests and the breakpoint hooks. */
function evaluate(query: string): boolean {
  const px = (v: string, unit: string) => (unit === "rem" ? Number(v) * 16 : Number(v));
  const max = /max-width:\s*([\d.]+)(px|rem)/u.exec(query);
  if (max) return getViewportWidth() <= px(max[1] ?? "0", max[2] ?? "px");
  const min = /min-width:\s*([\d.]+)(px|rem)/u.exec(query);
  if (min) return getViewportWidth() >= px(min[1] ?? "0", min[2] ?? "px");
  return false;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = () => undefined;
  window.scrollTo = () => undefined;
  resetViewport();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: evaluate(query),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
  window.localStorage.clear();
  delete (window as unknown as { __PLAYGROUND__?: unknown }).__PLAYGROUND__;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
