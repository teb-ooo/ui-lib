import { useSyncExternalStore } from "react";

/** Breakpoints as min-widths. They match Tailwind's sm, md and lg so `hideBelow` and utility classes agree. */
export const BREAKPOINTS = { sm: "40rem", md: "48rem", lg: "64rem" } as const;
export type Breakpoint = keyof typeof BREAKPOINTS;

function subscribe(query: string, notify: () => void): () => void {
  const list = window.matchMedia(query);
  list.addEventListener("change", notify);
  return () => list.removeEventListener("change", notify);
}

/** True while the media query matches. The server snapshot is false, so a first render assumes a phone. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => (typeof window.matchMedia === "function" ? subscribe(query, notify) : () => undefined),
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** True at and above the breakpoint's width. */
export function useMinWidth(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]})`);
}
