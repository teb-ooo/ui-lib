import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ChipTone = "default" | "ok" | "warn" | "muted" | "danger" | "link" | "agent";

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "className"> {
  /**
   * Colour is state: ok, warn, danger, link (a reference), agent (assistant activity). `muted` is quiet text.
   * @default "default"
   */
  tone?: ChipTone;
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

/** A static token: a status, a count, a reference. */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip({ tone = "default", className, ...rest }, ref) {
  return <span ref={ref} data-tone={tone} className={cn("chip", tones[tone], className)} {...rest} />;
});
