import { forwardRef } from "react";
import { Chip } from "./chip";
import type { ChipProps, ChipTone } from "./chip";

export type BadgeTone = "default" | "accent" | "danger";

export interface BadgeProps extends Omit<ChipProps, "tone"> {
  /**
   * `accent` renders as the `link` chip tone.
   * @default "default"
   */
  tone?: BadgeTone;
}

const map: Record<BadgeTone, ChipTone> = { default: "default", accent: "link", danger: "danger" };

/**
 * @deprecated Use `Chip`: a Badge is a Chip with fewer tones. Kept until 1.0 so existing imports keep working.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ tone = "default", ...rest }, ref) {
  return <Chip ref={ref} tone={map[tone]} {...rest} />;
});
