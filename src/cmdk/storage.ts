import { readPlayground } from "./playground-global";

export const MAX_RECENTS = 8;

/** localStorage key for the recents of this app. */
export function recentsKey(appName: string = readPlayground().appName): string {
  return `playground-command:recents:${appName || "app"}`;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Ids of the last commands run, most recent first. */
export function loadRecents(key: string = recentsKey()): string[] {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

/** Puts `id` first, drops duplicates, keeps eight; returns the new list. */
export function pushRecent(id: string, key: string = recentsKey()): string[] {
  const next = [id, ...loadRecents(key).filter((x) => x !== id)].slice(0, MAX_RECENTS);
  try {
    storage()?.setItem(key, JSON.stringify(next));
  } catch {
    // Storage full or blocked: recents are a convenience.
  }
  return next;
}
