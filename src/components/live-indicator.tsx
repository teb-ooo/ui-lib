import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type LiveStatus = "live" | "reconnecting" | "degraded" | "off";

export interface LiveIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> {
  /** The status `useLive()` from `@teb-ooo/web` reports. */
  status: LiveStatus;
  /**
   * Show the word next to the dot.
   * @default false
   */
  showLabel?: boolean;
  className?: string;
}

const labels: Record<LiveStatus, string> = {
  live: "Live",
  reconnecting: "Reconnecting",
  degraded: "Live updates degraded",
  off: "Not live",
};

// Colour is state: ok for live, warning while it is not whole, quiet when off. Degraded is a ring, so it differs without colour.
const dots: Record<LiveStatus, string> = {
  live: "bg-ok",
  reconnecting: "bg-warning",
  degraded: "border border-warning bg-transparent",
  off: "bg-ink-faint",
};

/** A small dot for whether a screen is receiving live updates, with an accessible label (and the word, with `showLabel`). */
export const LiveIndicator = forwardRef<HTMLSpanElement, LiveIndicatorProps>(function LiveIndicator({ status, showLabel = false, className, ...rest }, ref) {
  return (
    <span ref={ref} role="status" aria-label={showLabel ? undefined : labels[status]} data-status={status} className={cn("inline-flex items-center gap-2 text-ink-muted", className)} {...rest}>
      <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded", dots[status], status === "reconnecting" && "motion-safe:animate-pulse")} />
      {showLabel ? <span>{labels[status]}</span> : null}
    </span>
  );
});
