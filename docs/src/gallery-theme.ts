import { useCallback, useSyncExternalStore } from "react";

/**
 * The gallery's theme control, the only one in the playground: it forces a scheme by setting `data-theme` on
 * <html> (system removes the attribute so the OS decides) and remembers the choice in localStorage.
 * Apps and components never do this; the design test allows it in this package only.
 */
export type ThemeMode = "system" | "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["system", "light", "dark"];
const KEY = "theme";

function isMode(v: unknown): v is ThemeMode {
  return typeof v === "string" && (THEME_MODES as readonly string[]).includes(v);
}

export function currentTheme(): ThemeMode {
  const a = document.documentElement.getAttribute("data-theme");
  return isMode(a) ? a : "system";
}

/** Sets the attribute for this page only. */
export function setPageTheme(mode: ThemeMode): void {
  if (mode === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", mode);
}

/** Applies and remembers the choice. Storage failures are ignored. */
export function chooseTheme(mode: ThemeMode): void {
  setPageTheme(mode);
  try {
    if (mode === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, mode);
  } catch {
    // Blocked storage: the theme still applies for this page.
  }
}

/** Applies the remembered choice; call before the first render. */
export function restoreTheme(): void {
  try {
    const v = window.localStorage.getItem(KEY);
    if (isMode(v)) setPageTheme(v);
  } catch {
    // Blocked storage: follow the system.
  }
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  return THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length] ?? "system";
}

function subscribe(onChange: () => void): () => void {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const mode = useSyncExternalStore(subscribe, currentTheme, () => "system" as const);
  return [mode, useCallback((m: ThemeMode) => chooseTheme(m), [])];
}
