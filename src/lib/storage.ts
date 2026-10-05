// Guarded localStorage for the package's remembered conveniences (column choices, a pane width, recent commands). Storage
// can be blocked, full or absent (private windows, tests, server rendering): every call then does nothing and reads null,
// because none of these is anything the page depends on. New keys are named `teb-ui:<area>:<name>`.

function area(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The stored text, or null when absent or storage is unavailable. */
export function readStored(key: string): string | null {
  try {
    return area()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** The stored JSON value, or null when absent, unavailable or not JSON. */
export function readStoredJson(key: string): unknown {
  const raw = readStored(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    area()?.setItem(key, value);
  } catch {
    // full or blocked: not remembered
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  writeStored(key, JSON.stringify(value));
}

export function removeStored(key: string): void {
  try {
    area()?.removeItem(key);
  } catch {
    // nothing to forget
  }
}
