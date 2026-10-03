import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface DelayedProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string;
}

/**
 * Wrap an app's own loading UI (a "Loading" line, a skeleton, a spinner) in `Delayed`: it stays invisible for the first
 * 100ms and then fades in, so a fast response never flashes it. Skeletons, spinners and "Searching" lines inside the
 * package already do this. The space is kept while it waits, so nothing shifts.
 */
export const Delayed = forwardRef<HTMLDivElement, DelayedProps>(function Delayed({ className, ...rest }, ref) {
  return <div ref={ref} className={cn("anim-delayed", className)} {...rest} />;
});
