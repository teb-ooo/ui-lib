import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Lock, LockOpen, X } from "lucide-react";
import { cn } from "../lib/cn";

export type ChipTone = "default" | "ok" | "warn" | "muted" | "danger" | "link" | "agent";

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  /**
   * Colour is state: ok, warn, danger, link (a reference), agent (assistant activity). `muted` is quiet text.
   * @default "default"
   */
  tone?: ChipTone;
  /**
   * A priority level, 0 (most urgent) to 4, drawn from the priority scale (red, orange, yellow, sky, neutral). Priority is a
   * state like the tones above, so it is state colour; use it instead of `tone`, not with it.
   */
  priority?: 0 | 1 | 2 | 3 | 4;
  /** Adds a remove control (an X) after the label. */
  onRemove?: () => void;
  /** Accessible name of the remove control. @default "Remove" */
  removeLabel?: string;
  /** Adds a lock toggle after the label: locked (closed padlock) or unlocked. Set together with `onLockedChange`. */
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  /** Accessible name of the toggle while it is unlocked (the action it performs). @default "Lock" */
  lockLabel?: string;
  /** Accessible name of the toggle while it is locked. @default "Unlock" */
  unlockLabel?: string;
  className?: string;
}

const tones: Record<ChipTone, string | false> = {
  default: false,
  ok: "chip-ok",
  warn: "chip-warn",
  muted: "chip-muted",
  danger: "chip-danger",
  link: "chip-link",
  agent: "chip-agent",
};

const priorities = ["chip-p0", "chip-p1", "chip-p2", "chip-p3", "chip-p4"] as const;

const action =
  "-me-1 flex size-4 cursor-pointer items-center justify-center rounded bg-transparent p-0 text-current opacity-70 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-current";

/** A token: a status, a count, a reference. It can carry a remove control or a lock toggle. */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { tone = "default", priority, onRemove, removeLabel = "Remove", locked, onLockedChange, lockLabel = "Lock", unlockLabel = "Unlock", className, children, ...rest },
  ref,
) {
  const toggle = locked !== undefined && onLockedChange !== undefined;
  return (
    <span ref={ref} data-tone={tone} {...(priority !== undefined ? { "data-priority": priority } : {})} className={cn("chip", priority !== undefined ? priorities[priority] : tones[tone], className)} {...rest}>
      {children}
      {toggle ? (
        <button type="button" aria-label={locked ? unlockLabel : lockLabel} onClick={() => onLockedChange(!locked)} className={action}>
          {locked ? <Lock aria-hidden="true" className="size-3" /> : <LockOpen aria-hidden="true" className="size-3" />}
        </button>
      ) : null}
      {onRemove ? (
        <button type="button" aria-label={removeLabel} onClick={onRemove} className={action}>
          <X aria-hidden="true" className="size-3" />
        </button>
      ) : null}
    </span>
  );
});
