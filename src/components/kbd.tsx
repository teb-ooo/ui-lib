import { forwardRef, useSyncExternalStore } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

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

const kbdClass =
  "inline-flex min-w-5 items-center justify-center rounded-ctl border border-line bg-surface px-1 font-sans text-sm text-muted";

/** A keyboard-shortcut hint. Each key is its own `<kbd>`; the group carries a spoken label. */
export const Kbd = forwardRef<HTMLSpanElement, KbdProps>(function Kbd(
  { shortcut, children, className, ...rest },
  ref,
) {
  const apple = useIsApple();
  const wrapper = cn("inline-flex items-center gap-1", className);

  if (children !== undefined && children !== null && children !== false) {
    return (
      <span ref={ref} className={wrapper} {...rest}>
        <kbd className={kbdClass}>{children}</kbd>
      </span>
    );
  }

  const steps = shortcut ? parseShortcut(shortcut, apple) : [];
  const label = steps.map((s) => s.map((k) => k.spoken).join(" ")).join(" then ");
  return (
    <span ref={ref} role="group" aria-label={label || undefined} data-shortcut={shortcut} className={wrapper} {...rest}>
      {steps.map((step, i) => (
        <span key={i} aria-hidden="true" className="inline-flex items-center gap-1">
          {i > 0 ? <span className="text-sm text-muted">then</span> : null}
          {step.map((k, j) => (
            <kbd key={j} className={kbdClass}>
              {k.glyph}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  );
});
