import type { ReactElement, ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface PopoverProps {
  /** The element that opens it, typically a `Button`. */
  trigger: ReactElement<Record<string, unknown>>;
  /** Accessible name of the panel; drawn as its heading when `showTitle`. */
  title: string;
  /** Draw `title` as a heading at the top. @default false */
  showTitle?: boolean;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** @default "bottom" */
  side?: "top" | "bottom" | "left" | "right";
  /** @default "center" */
  align?: "start" | "center" | "end";
  /**
   * `true` blocks the rest of the page while it is open; `false` leaves the page usable and closes on Escape or an outside
   * press. @default false
   */
  modal?: boolean;
  /** A close button in the corner (always reachable by Escape anyway). @default false */
  showClose?: boolean;
  /** Label of the close button. @default "Close" */
  closeLabel?: string;
  /** Layout classes for the panel (the width). */
  className?: string;
}

/**
 * A panel anchored to its trigger: it opens on click or Enter, holds focus's next stop, closes on Escape or an outside
 * press and returns focus to the trigger. For details that do not fit a tooltip (a status, a few fields, a short list).
 * Use `Menu` for a list of actions, `Dialog` for something that needs an answer.
 */
export function Popover({ trigger, title, showTitle = false, children, open, defaultOpen, onOpenChange, side = "bottom", align = "center", modal = false, showClose = false, closeLabel = "Close", className }: PopoverProps) {
  return (
    <BasePopover.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align} sideOffset={6} collisionPadding={8} className="z-50 outline-none">
          <BasePopover.Popup aria-label={title} className={cn("anim-fade panel panel-float flex w-72 max-w-[calc(100vw-1rem)] flex-col gap-2 p-3 text-ink outline-none", className)}>
            {showTitle || showClose ? (
              <div className="flex items-start justify-between gap-3">
                {showTitle ? <BasePopover.Title className="text-ink">{title}</BasePopover.Title> : <span />}
                {showClose ? <BasePopover.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />} /> : null}
              </div>
            ) : null}
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
