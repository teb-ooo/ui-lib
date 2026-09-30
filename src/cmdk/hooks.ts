import { useEffect, useSyncExternalStore } from "react";

function subscribeMedia(query: string): (cb: () => void) => () => void {
  return (cb) => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
    const mql = window.matchMedia(query);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  };
}

/** Tracks a CSS media query. `false` when `matchMedia` is unavailable. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );
}

/** Below Tailwind's `sm` breakpoint: the palette is a full-height sheet. */
export const SHEET_QUERY = "(max-width: 639px)";

/**
 * While `enabled`, mirrors `window.visualViewport` (height minus the on-screen keyboard, and its offset)
 * into the CSS variables `--command-vv-height` and `--command-vv-top` on `<html>`, so the sheet can
 * size itself to what is actually visible. Variables are removed on cleanup.
 */
export function useVisualViewportVars(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const apply = (): void => {
      root.style.setProperty("--command-vv-height", `${vv.height}px`);
      root.style.setProperty("--command-vv-top", `${vv.offsetTop}px`);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      root.style.removeProperty("--command-vv-height");
      root.style.removeProperty("--command-vv-top");
    };
  }, [enabled]);
}
