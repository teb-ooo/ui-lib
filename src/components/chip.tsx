import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Lock, LockOpen, X } from "lucide-react";
import { cn } from "../lib/cn";

/** The colour names a `Chip` can carry (user-chosen labels and tags), one per ramp of the palette. */
export const CHIP_COLORS = ["red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"] as const;
export type ChipColor = (typeof CHIP_COLORS)[number];

export type ChipTone = "default" | "ok" | "warn" | "muted" | "danger" | "link" | "agent";

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  /**
   * Colour is state: ok, warn, danger, link (a reference), agent (assistant activity). `muted` is quiet text.
   * @default "default"
   */
  tone?: ChipTone;
  /**
   * An app-chosen swatch: one of the palette hues, drawn with a soft background, a line and ink that read well in light and
   * dark. For categories the app names itself (a label, a project, a priority level the app maps to hues). Use it instead
   * of `tone`, which carries state (ok, warn, danger).
   */
  color?: ChipColor;
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

const action =
  "-me-1 flex size-4 cursor-pointer items-center justify-center rounded bg-transparent p-0 text-current opacity-70 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-current";

/** A token: a status, a count, a reference. It can carry a remove control or a lock toggle. */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { tone = "default", color, onRemove, removeLabel = "Remove", locked, onLockedChange, lockLabel = "Lock", unlockLabel = "Unlock", className, children, ...rest },
  ref,
) {
  const toggle = locked !== undefined && onLockedChange !== undefined;
  return (
    <span ref={ref} data-tone={tone} {...(color !== undefined ? { "data-color": color } : {})} className={cn("chip", color === undefined && tones[tone], className)} {...rest}>
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
