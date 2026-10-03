import type { ReactElement, ReactNode, RefObject } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";

export type DialogPlacement = "center" | "top" | "right";

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog, typically a `Button`. Omit for a controlled dialog. */
  trigger?: ReactElement<Record<string, unknown>>;
  /** Accessible name of the dialog. */
  title: ReactNode;
  description?: ReactNode;
  /** Actions row, typically `Button`s. */
  footer?: ReactNode;
  children?: ReactNode;
  /**
   * `center` is a small centred panel. `top` is a wider panel near the top of the viewport (15vh),
   * the shape a command palette or a search box wants. `right` is a full-height drawer docked to the right edge
   * (full width on a phone) that slides in, for a side panel such as a revision history or an inspector.
   * @default "center"
   */
  placement?: DialogPlacement;
  /**
   * Bare mode: no padding, no header, no close control. `children` fill the panel edge to edge and the
   * title is announced but not drawn. For content that draws its own chrome, such as a command palette.
   * @default false
   */
  bare?: boolean;
  /** Inverted surface (white on a dark page, black on a light one, no border), as `Popover` is. @default false */
  inverted?: boolean;
  /** Element to focus on open (a ref), or `false` to leave focus alone. Default: the first focusable element. */
  initialFocus?: boolean | RefObject<HTMLElement | null>;
  /**
   * Label for the close control, for localisation.
   * @default "Close"
   */
  closeLabel?: string;
  /** Extra layout classes for the panel. */
  className?: string;
}

const placements: Record<DialogPlacement, string> = {
  center: "anim-fade panel panel-float left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
  top: "anim-fade panel panel-float left-1/2 top-[15vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2",
  right: "anim-slide-right panel panel-float right-0 top-0 h-dvh w-full max-w-xl overflow-y-auto rounded-none border-y-0 border-r-0",
};

export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  placement = "center",
  bare = false,
  inverted = false,
  initialFocus,
  closeLabel = "Close",
  className,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop forceRender className="anim-backdrop fixed inset-0 z-50 bg-black/50" />
        <BaseDialog.Popup
          data-placement={placement}
          {...(initialFocus !== undefined ? { initialFocus } : {})}
          className={cn(
            "fixed z-50 text-ink outline-none",
            inverted ? placements[placement].replace("panel ", "panel-inverse ") : placements[placement],
            bare ? "overflow-hidden" : "flex flex-col gap-4 p-4",
            className,
          )}
        >
          {bare ? (
            <>
              <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
              {description ? <BaseDialog.Description className="sr-only">{description}</BaseDialog.Description> : null}
              {children}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <BaseDialog.Title className="text-ink">{title}</BaseDialog.Title>
                <BaseDialog.Close
                  render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />}
                />
              </div>
              {description ? (
                <BaseDialog.Description className="text-ink-muted">{description}</BaseDialog.Description>
              ) : null}
              {children}
              {footer ? <div className="flex justify-end gap-2">{footer}</div> : null}
            </>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
