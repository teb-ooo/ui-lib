import type { ReactElement, ReactNode, RefObject } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { usePortalContainer } from "../lib/theme-scope";
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
  /** Inverted surface (white on a dark page, black on a light one, no border), as `Popover` is. A non-bare dialog is always inverted; a bare one (the palette) is inverted only when this is set. @default false */
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
  const container = usePortalContainer();
  // A dialog is inverted (white on a dark page, black on a light one) and drawn as three bands: a shaded header with the
  // title and close button, the content, and a shaded footer for the actions. A bare dialog (the palette) is only a surface.
  const invert = inverted || !bare;
  return (
    <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop forceRender className="anim-backdrop fixed inset-0 z-50 bg-black/50" />
        <BaseDialog.Popup
          data-placement={placement}
          {...(initialFocus !== undefined ? { initialFocus } : {})}
          className={cn(
            "fixed z-50 text-ink outline-none",
            invert ? placements[placement].replace("panel ", "panel-inverse ") : placements[placement],
            bare ? "overflow-hidden" : "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden",
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
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4 py-2">
                <BaseDialog.Title className="text-ink">{title}</BaseDialog.Title>
                <BaseDialog.Close
                  render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />}
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {description ? <BaseDialog.Description className="text-ink-muted">{description}</BaseDialog.Description> : null}
                {children}
              </div>
              {footer ? <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-surface px-4 py-2">{footer}</div> : null}
            </>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
