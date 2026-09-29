import type { ReactElement, ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

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

export function Tooltip({ tip, children, side = "top", delay = 400 }: TooltipProps) {
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger delay={delay} render={children} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} sideOffset={6} className="z-50">
            <BaseTooltip.Popup className="anim-fade panel px-2 text-ink">{tip}</BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
