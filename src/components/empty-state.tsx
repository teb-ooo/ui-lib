import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface EmptyStateProps {
  /** What is empty, in a few words: "No retired rules". */
  title: ReactNode;
  /** Why, and what to do about it: name the filter that hides the rows, or say how to add the first one. */
  description?: ReactNode;
  /** The way out: "Clear filters" or "New note". */
  action?: ReactNode;
  className?: string;
}

/**
 * The state of a list with nothing to show. Say why it is empty: filtered to nothing (name the filter and offer "Clear
 * filters") or really empty (say how to add the first). Use it as `DataTable`'s `empty` or in a pane.
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div role="status" className={cn("flex flex-col items-start gap-2 p-4", className)}>
      <p className="text-ink">{title}</p>
      {description ? <p className="text-ink-muted">{description}</p> : null}
      {action}
    </div>
  );
}
