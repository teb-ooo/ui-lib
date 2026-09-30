import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShortcutMatcher, eventMatchesChord, isTypingTarget, parseShortcut } from "../../src/cmdk/shortcuts";

const key = (k: string, init: KeyboardEventInit = {}): KeyboardEvent => new KeyboardEvent("keydown", { key: k, ...init });

describe("parseShortcut", () => {
  it("parses chords and sequences", () => {
    expect(parseShortcut("mod+shift+n")).toEqual([{ key: "n", mod: true, ctrl: false, meta: false, alt: false, shift: true }]);
    expect(parseShortcut("g i")?.map((c) => c.key)).toEqual(["g", "i"]);
    expect(parseShortcut("esc")?.[0]?.key).toBe("escape");
  });
  it("rejects malformed input", () => {
    expect(parseShortcut("")).toBeNull();
    expect(parseShortcut("mod+")).toBeNull();
    expect(parseShortcut("a+b")).toBeNull();
  });
});

describe("eventMatchesChord", () => {
  it("resolves mod per platform and requires exact modifiers", () => {
    const chord = parseShortcut("mod+k")?.[0];
    if (!chord) throw new Error("parse");
    expect(eventMatchesChord(key("k", { ctrlKey: true }), chord, false)).toBe(true);
    expect(eventMatchesChord(key("k", { metaKey: true }), chord, false)).toBe(false);
    expect(eventMatchesChord(key("k", { metaKey: true }), chord, true)).toBe(true);
    expect(eventMatchesChord(key("k", { ctrlKey: true, shiftKey: true }), chord, false)).toBe(false);
    expect(eventMatchesChord(key("k"), chord, false)).toBe(false);
  });
  it("matches shifted letters case-insensitively", () => {
    const chord = parseShortcut("mod+shift+n")?.[0];
    if (!chord) throw new Error("parse");
    expect(eventMatchesChord(key("N", { ctrlKey: true, shiftKey: true }), chord, false)).toBe(true);
  });
});

describe("isTypingTarget", () => {
  it("recognises fields but not buttons", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    const cb = document.createElement("input");
    cb.type = "checkbox";
    expect(isTypingTarget(cb)).toBe(false);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    expect(isTypingTarget(div)).toBe(true);
  });
});

describe("ShortcutMatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const bind = (s: string, target: string) => {
    const parsed = parseShortcut(s);
    if (!parsed) throw new Error("parse");
    return { parsed, target };
  };

  it("fires a single chord", () => {
    const m = new ShortcutMatcher<string>(1000, false);
    expect(m.feed(key("n", { ctrlKey: true, shiftKey: true }), [bind("mod+shift+n", "new")], false).target).toBe("new");
  });

  it("fires a sequence after both steps and not before", () => {
    const m = new ShortcutMatcher<string>(1000, false);
    const b = [bind("g i", "items")];
    expect(m.feed(key("g"), b, false)).toEqual({ target: null, consumed: true });
    expect(m.pending).toBe(true);
    expect(m.feed(key("i"), b, false).target).toBe("items");
    expect(m.pending).toBe(false);
  });

  it("forgets a sequence after the timeout", () => {
    const m = new ShortcutMatcher<string>(1000, false);
    const b = [bind("g i", "items")];
    m.feed(key("g"), b, false);
    vi.advanceTimersByTime(1001);
    expect(m.pending).toBe(false);
    expect(m.feed(key("i"), b, false).target).toBeNull();
  });

  it("restarts when a wrong second key is itself a first key", () => {
    const m = new ShortcutMatcher<string>(1000, false);
    const b = [bind("g i", "items"), bind("g h", "home")];
    m.feed(key("g"), b, false);
    m.feed(key("g"), b, false);
    expect(m.feed(key("h"), b, false).target).toBe("home");
  });

  it("ignores bare keys while typing but not Ctrl chords", () => {
    const m = new ShortcutMatcher<string>(1000, false);
    expect(m.feed(key("g"), [bind("g i", "items")], true).consumed).toBe(false);
    expect(m.feed(key("n", { ctrlKey: true }), [bind("mod+n", "new")], true).target).toBe("new");
  });
});
