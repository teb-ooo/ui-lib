import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type BadgeTone = "default" | "accent" | "danger";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  /**
   * Colour of the border and text.
   * @default "default"
   */
  tone?: BadgeTone;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  default: "border-line text-muted",
  accent: "border-accent text-accent",
  danger: "border-danger text-danger",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "default", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      data-tone={tone}
      className={cn(
        "inline-flex items-center rounded-ctl border px-1.5 font-sans text-sm uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
});
