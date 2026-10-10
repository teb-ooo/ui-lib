import { useRef, useState } from "react";
import type { ReactElement, ReactNode, RefObject } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { CONTROLS, PanelHandle, panelDepthStyle, usePanelDrag, usePanelStyle, usePanelsAbove, usePhone } from "../lib/bottom-panel";
import { usePortalContainer } from "../lib/theme-scope";

/** `dialog` is a small centred panel for one decision or a short task; `drawer` is a full-height panel docked to a side; `top` is a wider panel near the top (the shape of a command palette). */
export type ModalVariant = "dialog" | "drawer" | "top";

export interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens it, typically a `Button`. Omit for a controlled modal. */
  trigger?: ReactElement<Record<string, unknown>>;
  /** Accessible name; drawn as the heading. */
  title: ReactNode;
  description?: ReactNode;
  /** Actions row at the bottom, typically `Button`s. */
  footer?: ReactNode;
  children?: ReactNode;
  /**
   * What it is above a phone: `dialog` (centred, inverted), `drawer` (docked to `side`, 24rem wide) or `top` (wide, near the
   * top). On a phone every variant but a `bare` one is the same reversed bottom panel.
   * @default "dialog"
   */
  variant?: ModalVariant;
  /** The side a `drawer` is docked to above a phone. @default "right" */
  side?: "left" | "right";
  /**
   * `true` dims the page, blocks it and traps focus. `false` leaves the page usable beside it, with no backdrop (a control
   * panel next to a live view); it closes on Escape or its close button, not on a click outside.
   * @default true
   */
  modal?: boolean;
  /**
   * No padding, no header, no close control: `children` fill the panel edge to edge and the title is announced but not drawn,
   * for content that draws its own chrome (a command palette). A bare modal is never a bottom panel.
   * @default false
   */
  bare?: boolean;
  /** Inverted surface for a bare modal; any other is inverted already (a drawer is the page's own colours above a phone). @default false */
  inverted?: boolean;
  /** Element to focus on open (a ref), or `false` to leave focus alone. Default: the first control of the content, else the first tabbable. */
  initialFocus?: boolean | RefObject<HTMLElement | null>;
  /** Label of the close button. @default "Close" */
  closeLabel?: string;
  /** Layout classes for the panel above a phone (its width). */
  className?: string;
}

const placements: Record<ModalVariant, string> = {
  dialog: "anim-fade panel panel-float left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
  top: "anim-fade panel panel-float left-1/2 top-[15vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2",
  drawer: "panel panel-float inset-y-0 w-96 rounded-none border-y-0",
};

/**
 * The one thing drawn over the page that needs an answer or holds a task: a centred `dialog`, a docked `drawer` or a `top`
 * panel above a phone, and on a phone always a reversed bottom panel with a grab handle (drag it down to close). It has a
 * title, a close button, an optional description and footer, traps focus, returns it to the trigger and closes on Escape.
 * A modal opened from a modal (or from a `Select`, `Menu` or `Popover` panel) stacks in front of it. Use `ConfirmDialog` for a
 * yes or no and `Popover` for details anchored to a control.
 */
export function Modal({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  variant = "dialog",
  side = "right",
  modal = true,
  bare = false,
  inverted = false,
  initialFocus,
  closeLabel = "Close",
  className,
}: ModalProps) {
  const container = usePortalContainer();
  const body = useRef<HTMLDivElement>(null);
  // Focus starts on the first control of the content (the first field of a form), not on the close button above it; with no
  // control in the content, on the default (the first tabbable). `initialFocus` overrides it.
  const firstControl = () => body.current?.querySelector<HTMLElement>(CONTROLS) ?? true;
  const phone = usePhone() && !bare;
  const panelStyle = usePanelStyle();
  const [internal, setInternal] = useState(defaultOpen ?? false);
  const shown = open ?? internal;
  const setOpen = (next: boolean, ...details: unknown[]) => {
    if (open === undefined) setInternal(next);
    (onOpenChange as ((open: boolean, ...rest: unknown[]) => void) | undefined)?.(next, ...details);
  };
  const above = usePanelsAbove(phone && shown);
  const drag = usePanelDrag(() => setOpen(false));
  const centred = !phone && variant !== "drawer"; // the shaded three-band look
  const invert = inverted || (!bare && variant !== "drawer");

  let popupClass: string;
  if (phone) popupClass = "anim-panel panel-inverse panel-float fixed z-50 flex max-h-[85dvh] w-full flex-col rounded-b-none border-b-0 text-ink outline-none";
  else if (variant === "drawer")
    popupClass = cn("anim-sheet fixed z-50 flex flex-col text-ink outline-none", placements.drawer, side === "right" ? "right-0 left-auto border-r-0" : "left-0 right-auto border-l-0", className);
  else
    popupClass = cn(
      "fixed z-50 text-ink outline-none",
      invert ? placements[variant].replace("panel ", "panel-inverse ") : placements[variant],
      bare ? "overflow-hidden" : "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden",
      className,
    );

  return (
    <BaseDialog.Root open={shown} onOpenChange={setOpen} modal={modal} disablePointerDismissal={!modal}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal container={container}>
        {modal ? <BaseDialog.Backdrop forceRender className="anim-backdrop fixed inset-0 z-50 bg-black/50" /> : null}
        <BaseDialog.Popup
          data-side={side}
          data-variant={variant}
          initialFocus={initialFocus ?? firstControl}
          style={phone ? { ...panelStyle, left: 0, right: 0, ...(drag.style ?? panelDepthStyle(above)) } : undefined}
          className={popupClass}
        >
          {bare ? (
            <>
              <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
              {description ? <BaseDialog.Description className="sr-only">{description}</BaseDialog.Description> : null}
              {children}
            </>
          ) : (
            <>
              {phone ? <PanelHandle {...drag.handle} /> : null}
              <div
                className={cn(
                  "flex shrink-0 justify-between gap-4 px-4",
                  centred ? "items-center border-b border-line bg-surface py-2" : cn("items-start pb-2", phone ? "pt-0" : "pt-4"),
                )}
              >
                <BaseDialog.Title className="text-ink">{title}</BaseDialog.Title>
                <BaseDialog.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />} />
              </div>
              {description || children ? (
                <div ref={body} className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]", centred && "pt-4")}>
                  {description ? <BaseDialog.Description className="text-ink-muted">{description}</BaseDialog.Description> : null}
                  {children}
                </div>
              ) : null}
              {footer ? (
                <div className={cn("flex shrink-0 justify-end gap-2 border-t border-line px-4", centred ? "bg-surface py-2" : "py-3")}>{footer}</div>
              ) : null}
            </>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
