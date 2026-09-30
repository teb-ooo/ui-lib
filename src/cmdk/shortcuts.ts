/** One key press: modifiers plus a key. */
export interface Chord {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

/** A shortcut: one chord, or several pressed in turn (`g i`). */
export type ParsedShortcut = Chord[];

const KEY_ALIASES: Record<string, string> = {
  esc: "escape",
  return: "enter",
  del: "delete",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  space: " ",
  plus: "+",
  spacebar: " ",
};

/** True on Apple platforms, where `mod` means Cmd. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform) || /mac|iphone|ipad|ipod/i.test(nav.userAgent ?? "");
}

/**
 * Parses `"mod+shift+n"` or `"g i"` (steps separated by spaces, keys by `+`).
 * Returns `null` for an empty or malformed shortcut.
 */
export function parseShortcut(shortcut: string): ParsedShortcut | null {
  const steps = shortcut.trim().split(/\s+/u).filter(Boolean);
  if (steps.length === 0) return null;
  const chords: Chord[] = [];
  for (const step of steps) {
    const chord: Chord = { key: "", mod: false, ctrl: false, meta: false, alt: false, shift: false };
    // A trailing "+" is the plus key itself ("mod++").
    const tokens = step === "+" ? ["+"] : step.replace(/\+\+$/u, "+plus").split("+").filter(Boolean);
    for (const raw of tokens) {
      const t = raw.toLowerCase();
      if (t === "mod") chord.mod = true;
      else if (t === "ctrl" || t === "control") chord.ctrl = true;
      else if (t === "cmd" || t === "meta" || t === "command") chord.meta = true;
      else if (t === "alt" || t === "option") chord.alt = true;
      else if (t === "shift") chord.shift = true;
      else if (chord.key === "") chord.key = KEY_ALIASES[t] ?? t;
      else return null;
    }
    if (chord.key === "") return null;
    chords.push(chord);
  }
  return chords;
}

function isPlainSymbol(key: string): boolean {
  return key.length === 1 && !/[a-z0-9]/iu.test(key) && key !== " ";
}

/** Does the keyboard event press this chord? Modifiers must match exactly. */
export function eventMatchesChord(event: KeyboardEvent, chord: Chord, apple: boolean): boolean {
  const wantMeta = chord.meta || (chord.mod && apple);
  const wantCtrl = chord.ctrl || (chord.mod && !apple);
  if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl || event.altKey !== chord.alt) return false;
  // "?" needs shift on most layouts, so shift is not compared for symbol keys.
  if (!isPlainSymbol(chord.key) && event.shiftKey !== chord.shift) return false;
  const key = event.key.toLowerCase();
  if (key === chord.key) return true;
  // With Alt held, macOS reports a composed character; fall back to the physical key.
  if (chord.alt && chord.key.length === 1) {
    const code = event.code;
    return code === `Key${chord.key.toUpperCase()}` || code === `Digit${chord.key}`;
  }
  return false;
}

/** True when the chord uses Ctrl, Cmd or Alt, so it is safe to fire while the user types in a field. */
export function hasCommandModifier(chord: Chord): boolean {
  return chord.mod || chord.ctrl || chord.meta || chord.alt;
}

/** Is this element one the user types into (input, textarea, select, contenteditable)? */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["button", "checkbox", "radio", "submit", "reset", "range", "color", "file", "image"].includes(type);
  }
  if (target.isContentEditable) return true;
  const ce = target.getAttribute("contenteditable");
  return ce !== null && ce !== "false";
}

export interface BoundShortcut<T> {
  parsed: ParsedShortcut;
  target: T;
}

/**
 * Matches key presses against bound shortcuts, including sequences with a timeout between steps.
 * Pure state machine: feed it events, it returns the target to run (or `null`).
 */
export class ShortcutMatcher<T> {
  private progress: BoundShortcut<T>[] = [];
  private step = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly timeoutMs = 1000,
    private readonly apple = isApplePlatform(),
  ) {}

  reset(): void {
    this.progress = [];
    this.step = 0;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** True while waiting for the next key of a sequence. */
  get pending(): boolean {
    return this.progress.length > 0;
  }

  /**
   * @param typing whether the event came from a text field; only chords with Ctrl/Cmd/Alt fire then.
   * @returns the matched target, or `null`. `consumed` tells the caller to `preventDefault`.
   */
  feed(event: KeyboardEvent, bindings: readonly BoundShortcut<T>[], typing: boolean): { target: T | null; consumed: boolean } {
    if (event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta") {
      return { target: null, consumed: false };
    }
    const candidates = this.progress.length > 0 ? this.progress : bindings.map((b) => b);
    const step = this.progress.length > 0 ? this.step : 0;
    const next: BoundShortcut<T>[] = [];
    for (const b of candidates) {
      const chord = b.parsed[step];
      if (!chord) continue;
      if (typing && step === 0 && !hasCommandModifier(chord)) continue;
      if (eventMatchesChord(event, chord, this.apple)) next.push(b);
    }
    if (next.length === 0) {
      const hadPending = this.progress.length > 0;
      this.reset();
      // A failed sequence may still start a new one with this very key.
      return hadPending ? this.feed(event, bindings, typing) : { target: null, consumed: false };
    }
    const done = next.find((b) => b.parsed.length === step + 1);
    const longer = next.filter((b) => b.parsed.length > step + 1);
    if (done && longer.length === 0) {
      this.reset();
      return { target: done.target, consumed: true };
    }
    if (longer.length > 0) {
      // Prefer waiting for the longer sequence; a completed shorter one on the same prefix is shadowed.
      this.progress = longer;
      this.step = step + 1;
      if (this.timer !== undefined) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.reset(), this.timeoutMs);
      return { target: null, consumed: true };
    }
    this.reset();
    return { target: null, consumed: false };
  }
}
