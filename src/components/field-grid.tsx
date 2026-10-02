import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface FieldGridProps {
  /** Accessible name of the list of fields. */
  label?: string;
  /** The `FieldRow`s. */
  children: ReactNode;
  className?: string;
}

export interface FieldRowProps {
  /** The field's name, shown in the label rail. */
  label: ReactNode;
  /** The value: text, an input, an editor, chips. */
  children: ReactNode;
  /** A draft value reads as muted text; a canon value reads as ink. @default false */
  draft?: boolean;
  /** Row actions (icon `Button`s, a promote control). Shown on hover and keyboard focus, always on touch screens. */
  actions?: ReactNode;
  className?: string;
}

/**
 * A record's fields as rows: a label rail on the left, the value on the right (stacked on a phone).
 * Read-only values and editors share the same grid, so a record looks the same in both modes.
 */
export function FieldGrid({ label, children, className }: FieldGridProps) {
  return (
    <dl aria-label={label} className={cn("flex flex-col divide-y divide-line", className)}>
      {children}
    </dl>
  );
}

export function FieldRow({ label, children, draft = false, actions, className }: FieldRowProps) {
  return (
    <div data-draft={draft ? "" : undefined} className={cn("group/row grid items-baseline gap-x-4 gap-y-1 py-2 md:grid-cols-[8rem_1fr]", className)}>
      <dt className="text-ink-muted uppercase md:text-right">{label}</dt>
      <dd className="m-0 flex min-w-0 items-baseline gap-2">
        <div className={cn("min-w-0 flex-1", draft ? "text-ink-muted" : "text-ink")}>{children}</div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:hover)]:opacity-0">
            {actions}
          </div>
        ) : null}
      </dd>
    </div>
  );
}
