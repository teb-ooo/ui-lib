import { getPlayground } from "@teb-ooo/web";
import { readStoredJson, writeStoredJson } from "../lib/storage";

export const MAX_RECENTS = 8;

/** localStorage key for the recents of this app. */
export function recentsKey(appName: string = getPlayground().appName): string {
  return `playground-command:recents:${appName || "app"}`;
}

/** Ids of the last commands run, most recent first. */
export function loadRecents(key: string = recentsKey()): string[] {
  const parsed = readStoredJson(key);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENTS);
}

/** Puts `id` first, drops duplicates, keeps eight; returns the new list. */
export function pushRecent(id: string, key: string = recentsKey()): string[] {
  const next = [id, ...loadRecents(key).filter((x) => x !== id)].slice(0, MAX_RECENTS);
  writeStoredJson(key, next);
  return next;
}
