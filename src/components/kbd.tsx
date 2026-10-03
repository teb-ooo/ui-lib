import { forwardRef, useSyncExternalStore } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { keysFor, useKeysDown, useKeysPressed } from "./kbd-pressed";

export interface KbdProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> {
  /**
   * Shortcut such as `mod+k` or `shift+enter`. Keys join with `+`; a space-separated
   * sequence such as `g i` renders as steps with "then" between them.
   */
  shortcut?: string;
  /** Free text; overrides `shortcut`. */
  children?: ReactNode;
  className?: string;
}

interface KeyLabel {
  /** What is drawn. */
  glyph: string;
  /** What assistive technology says. */
  spoken: string;
  /** The key this label stands for (lower-case), for noticing it being pressed. */
  token: string;
}

function subscribe(): () => void {
  return () => undefined;
}

function detectApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform) || /mac|iphone|ipad|ipod/i.test(nav.userAgent ?? "");
}

/** True on Apple platforms. The server snapshot is false, so SSR and hydration render `Ctrl`. */
export function useIsApple(): boolean {
  return useSyncExternalStore(subscribe, detectApple, () => false);
}

/** Label for one key token (already lower-cased) on the given platform. */
export function keyLabel(token: string, apple: boolean): KeyLabel {
  return { ...baseLabel(token, apple), token };
}

function baseLabel(token: string, apple: boolean): Omit<KeyLabel, "token"> {
  switch (token) {
    case "mod":
      return apple ? { glyph: "⌘", spoken: "Command" } : { glyph: "Ctrl", spoken: "Control" };
    case "cmd":
    case "meta":
      return { glyph: "⌘", spoken: "Command" };
    case "ctrl":
    case "control":
      return apple ? { glyph: "⌃", spoken: "Control" } : { glyph: "Ctrl", spoken: "Control" };
    case "alt":
    case "option":
      return apple ? { glyph: "⌥", spoken: "Option" } : { glyph: "Alt", spoken: "Alt" };
    case "shift":
      return { glyph: "⇧", spoken: "Shift" };
    case "enter":
    case "return":
      return { glyph: "↵", spoken: "Enter" };
    case "esc":
    case "escape":
      return { glyph: "Esc", spoken: "Escape" };
    case "tab":
      return { glyph: "Tab", spoken: "Tab" };
    case "space":
      return { glyph: "Space", spoken: "Space" };
    case "backspace":
      return { glyph: "⌫", spoken: "Backspace" };
    case "delete":
    case "del":
      return { glyph: "Del", spoken: "Delete" };
    case "up":
      return { glyph: "↑", spoken: "Up arrow" };
    case "down":
      return { glyph: "↓", spoken: "Down arrow" };
    case "left":
      return { glyph: "←", spoken: "Left arrow" };
    case "right":
      return { glyph: "→", spoken: "Right arrow" };
    default: {
      const g = token.length === 1 ? token.toUpperCase() : token.charAt(0).toUpperCase() + token.slice(1);
      return { glyph: g, spoken: g };
    }
  }
}

/** Parses `"mod+k"` or `"g i"` into steps of key labels. */
export function parseShortcut(shortcut: string, apple: boolean): KeyLabel[][] {
  return shortcut
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((step) =>
      step
        .split("+")
        .filter(Boolean)
        .map((t) => keyLabel(t.toLowerCase(), apple)),
    );
}

// One key is a square keycap: as tall as it is wide for a single character (1.5rem both ways), wider only for words
// such as Ctrl or Space. A fixed height with the line height reset centres the glyph in the box instead of in a taller line box.
const kbdClass =
  "inline-flex h-6 min-w-6 items-center justify-center rounded border border-line bg-surface px-1.5 leading-none text-ink-muted " +
  // Subtle: while the real key is down, the keycap darkens a touch and sits a pixel lower.
  "transition-colors data-[pressed]:translate-y-px data-[pressed]:border-line-strong data-[pressed]:bg-surface-raised data-[pressed]:text-ink";

// Letters, digits and most symbols sit exactly in the middle of the square. These symbol glyphs come from a fallback
// font with other vertical metrics, so each is nudged (CSS px, down is positive) to put its ink in the middle, measured
// at 8x on a 24px keycap.
const glyphNudge: Record<string, number> = { "⌃": 3.9, "↵": 0.75, "⌥": -0.6, "⌘": -0.4 };

// A chord (two or more keys pressed together) is one box: the keys sit inside it, each lights as its real key goes down, and
// when all are down the box itself lights.
const chordClass =
  "inline-flex h-6 items-stretch gap-0.5 rounded border border-line bg-surface p-0.5 text-ink-muted " +
  "transition-colors data-[complete]:border-ink data-[complete]:bg-surface-raised data-[complete]:text-ink";
const chordKeyClass =
  "inline-flex min-w-5 items-center justify-center rounded px-1 leading-none transition-colors " +
  "data-[pressed]:bg-surface-raised data-[pressed]:text-ink data-[complete-key]:bg-transparent";

function Glyph({ children }: { children: ReactNode }) {
  const nudge = typeof children === "string" ? glyphNudge[children] : undefined;
  return nudge === undefined ? <>{children}</> : <span style={{ transform: `translateY(${nudge}px)` }}>{children}</span>;
}

/** A chord in one box. */
function Chord({ keys, apple }: { keys: KeyLabel[]; apple: boolean }) {
  const flags = useKeysDown(keys.map((k) => keysFor(k.token, apple)));
  const all = flags.length > 0 && flags.every(Boolean);
  return (
    <span data-complete={all ? "" : undefined} className={chordClass}>
      {keys.map((k, j) => (
        <kbd key={j} className={chordKeyClass} data-pressed={flags[j] ? "" : undefined}>
          <Glyph>{k.glyph}</Glyph>
        </kbd>
      ))}
    </span>
  );
}

/** One keycap that notices its own key being pressed. */
function KeyCap({ token, apple, children }: { token: string; apple: boolean; children: ReactNode }) {
  const pressed = useKeysPressed(keysFor(token, apple));
  const nudge = typeof children === "string" ? glyphNudge[children] : undefined;
  return (
    <kbd className={kbdClass} data-pressed={pressed ? "" : undefined}>
      {nudge === undefined ? children : <span style={{ transform: `translateY(${nudge}px)` }}>{children}</span>}
    </kbd>
  );
}

/** A keyboard-shortcut hint. A single key is a keycap; a chord is one box holding its keys; the group carries a spoken label. */
export const Kbd = forwardRef<HTMLSpanElement, KbdProps>(function Kbd(
  { shortcut, children, className, ...rest },
  ref,
) {
  const apple = useIsApple();
  const wrapper = cn("inline-flex items-center gap-1", className);

  if (children !== undefined && children !== null && children !== false) {
    return (
      <span ref={ref} className={wrapper} {...rest}>
        <KeyCap token={typeof children === "string" ? children.trim().toLowerCase() : ""} apple={apple}>
          {children}
        </KeyCap>
      </span>
    );
  }

  const steps = shortcut ? parseShortcut(shortcut, apple) : [];
  const label = steps.map((s) => s.map((k) => k.spoken).join(" ")).join(" then ");
  return (
    <span ref={ref} role="group" aria-label={label || undefined} data-shortcut={shortcut} className={wrapper} {...rest}>
      {steps.map((step, i) => (
        <span key={i} aria-hidden="true" className="inline-flex items-center gap-1">
          {i > 0 ? <span className="text-ink-faint">then</span> : null}
          {step.length > 1 ? (
            <Chord keys={step} apple={apple} />
          ) : (
            step.map((k, j) => (
              <KeyCap key={j} token={k.token} apple={apple}>
                {k.glyph}
              </KeyCap>
            ))
          )}
        </span>
      ))}
    </span>
  );
});
