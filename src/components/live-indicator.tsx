import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Tooltip } from "./tooltip";

export type LiveStatus = "live" | "reconnecting" | "degraded" | "off";

export interface LiveIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> {
  /** The status `useLive()` from `@teb-ooo/web` reports. */
  status: LiveStatus;
  /**
   * Add a tooltip: `true` shows the status name ("Live"), or give the text. The dot becomes focusable so the tooltip
   * works from the keyboard. Off by default.
   */
  tip?: ReactNode | true;
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

/**
 * A single dot for whether a screen is receiving live updates, with an accessible label for assistive technology.
 * Place it in the app header right next to the "staging" label (or where that label would be). It is only a dot:
 * never a chip, never visible text.
 */
export const LiveIndicator = forwardRef<HTMLSpanElement, LiveIndicatorProps>(function LiveIndicator({ status, tip, className, ...rest }, ref) {
  const dot = (
    <span
      ref={ref}
      role="status"
      aria-label={labels[status]}
      data-status={status}
      {...(tip !== undefined && tip !== false ? { tabIndex: 0 } : {})}
      className={cn("inline-flex items-center", className)}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn("inline-block size-2 shrink-0 rounded", dots[status], status === "reconnecting" && "motion-safe:animate-pulse")}
      />
    </span>
  );
  if (tip === undefined || tip === false) return dot;
  return <Tooltip tip={tip === true ? labels[status] : tip}>{dot}</Tooltip>;
});
