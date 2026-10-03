import type { ReactElement, ReactNode } from "react";
import { Popover } from "./popover";

export interface TooltipProps {
  /** Text shown on hover and keyboard focus. The one tooltip mechanism: never a `title` attribute. */
  tip: ReactNode;
  /** The element that triggers it: a `Button`, `LinkButton`, or any focusable element. */
  children: ReactElement<Record<string, unknown>>;
  /**
   * Which side of the trigger the tip opens on.
   * @default "top"
   */
  side?: "top" | "bottom" | "left" | "right";
  /**
   * Milliseconds before it opens.
   * @default 400
   */
  delay?: number;
}

/**
 * One line of text on hover and keyboard focus. This is `Popover openOn="hover"` with a `tip`: the hover mode of the one
 * anchored-panel component, kept as its own name because `tip` on `Button` and `LinkButton` is used everywhere.
 */
export function Tooltip({ tip, children, side = "top", delay = 400 }: TooltipProps) {
  return <Popover openOn="hover" tip={tip} trigger={children} side={side} delay={delay} />;
}
