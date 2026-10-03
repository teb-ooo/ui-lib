import { useSyncExternalStore } from "react";

/**
 * Which keys are down right now, shared by every `Kbd` on the page through one set of window listeners (added with the
 * first key on screen, removed with the last). Keys are stored as `KeyboardEvent.key` lower-cased, so "Meta" is
 * "meta", "ArrowUp" is "arrowup" and a space is " ".
 */
const down = new Set<string>();
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let attached = false;
let version = 0;

const MODIFIERS = new Set(["meta", "control", "alt", "shift"]);

function emit() {
  version++;
  for (const l of listeners) l();
}

function release(key: string) {
  const t = timers.get(key);
  if (t !== undefined) clearTimeout(t);
  timers.delete(key);
  if (down.delete(key)) emit();
}

function onKeyDown(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  if (!down.has(key)) {
    down.add(key);
    emit();
  }
  // With Command held, the browser never sends keyup for the letter: let it go on its own.
  if (!MODIFIERS.has(key) && e.metaKey) {
    const t = timers.get(key);
    if (t !== undefined) clearTimeout(t);
    timers.set(key, setTimeout(() => release(key), 300));
  }
}

function onKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  release(key);
  // Letting go of Command also lets go of the keys pressed with it.
  if (key === "meta") for (const k of [...down]) if (!MODIFIERS.has(k)) release(k);
}

function onBlur() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  if (down.size > 0) {
    down.clear();
    emit();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!attached && typeof window !== "undefined") {
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    attached = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && attached) {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
      attached = false;
      onBlur();
    }
  };
}

/** The `KeyboardEvent.key` values (lower-cased) that count as this key token being pressed. */
export function keysFor(token: string, apple: boolean): string[] {
  switch (token) {
    case "mod":
      return apple ? ["meta"] : ["control"];
    case "cmd":
    case "meta":
      return ["meta"];
    case "ctrl":
    case "control":
      return ["control"];
    case "alt":
    case "option":
      return ["alt"];
    case "shift":
      return ["shift"];
    case "enter":
    case "return":
      return ["enter"];
    case "esc":
    case "escape":
      return ["escape"];
    case "space":
      return [" "];
    case "backspace":
      return ["backspace"];
    case "delete":
    case "del":
      return ["delete"];
    case "up":
      return ["arrowup"];
    case "down":
      return ["arrowdown"];
    case "left":
      return ["arrowleft"];
    case "right":
      return ["arrowright"];
    default:
      return [token];
  }
}

/** True while any of these keys is down. Used for the subtle pressed look of a keycap. */
export function useKeysPressed(keys: readonly string[]): boolean {
  const snapshot = () => keys.some((k) => down.has(k));
  void version;
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/**
 * For each key (given as the `KeyboardEvent.key` values that count as it), whether it is down right now: one subscription for
 * a whole chord, so the chord can tell when every key is down at once.
 */
export function useKeysDown(groups: ReadonlyArray<readonly string[]>): boolean[] {
  const snapshot = () => groups.map((g) => (g.some((k) => down.has(k)) ? "1" : "0")).join("");
  const state = useSyncExternalStore(subscribe, snapshot, () => groups.map(() => "0").join(""));
  return state.split("").map((c) => c === "1");
}
