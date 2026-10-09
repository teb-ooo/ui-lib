import { useRef, useState } from "react";
import type { PointerEvent, ReactElement, ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { usePortalContainer } from "../lib/theme-scope";

export interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An element that opens it, typically a `Button`; omit for a controlled sheet. */
  trigger?: ReactElement<Record<string, unknown>>;
  /** Accessible name; drawn as the heading. */
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Actions row at the bottom, typically `Button`s. */
  footer?: ReactNode;
  /**
   * `true` dims the page, blocks it and traps focus (a form that must be finished). `false` leaves the page usable beside it, with no
   * backdrop: a control panel next to a live view. A non-modal sheet closes on Escape or its close button, not on a click outside.
   * @default true
   */
  modal?: boolean;
  /** From the lg breakpoint the sheet is a panel on this side; below it, it is always a bottom sheet. @default "right" */
  side?: "left" | "right";
  /** Label of the close button. @default "Close" */
  closeLabel?: string;
  /** Layout classes for the panel (its width from lg, for example `lg:w-[28rem]`). */
  className?: string;
}

const DISMISS_PX = 96;

/**
 * A panel that holds controls without leaving the page: on a phone a bottom sheet with a drag handle (drag it down to close),
 * from the lg breakpoint a side panel. Modal by default; `modal={false}` keeps the page usable beside it. It has a title,
 * a close button, optional description and footer, returns focus to its trigger and closes on Escape.
 */
export function Sheet({ open, defaultOpen, onOpenChange, trigger, title, description, children, footer, modal = true, side = "right", closeLabel = "Close", className }: SheetProps) {
  const portalContainer = usePortalContainer();
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const [internal, setInternal] = useState(defaultOpen ?? false);
  const shown = open ?? internal;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    start.current = e.clientY;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current));
  };
  const onUp = () => {
    const far = drag > DISMISS_PX;
    start.current = null;
    setDrag(0);
    if (far) setOpen(false);
  };
  return (
    <BaseDialog.Root open={shown} onOpenChange={(o) => setOpen(o)} modal={modal} disablePointerDismissal={!modal}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal container={portalContainer}>
        {modal ? <BaseDialog.Backdrop forceRender className="anim-backdrop fixed inset-0 z-50 bg-black/50" /> : null}
        <BaseDialog.Popup
          data-side={side}
          style={drag > 0 ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
          className={cn(
            "anim-sheet panel panel-float fixed z-50 flex flex-col text-ink outline-none",
            // phone: bottom sheet
            "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-b-none border-b-0",
            // from lg: a full-height side panel
            "lg:inset-y-0 lg:max-h-none lg:w-96 lg:rounded-none lg:border-y-0",
            side === "right" ? "lg:right-0 lg:left-auto lg:border-r-0" : "lg:left-0 lg:right-auto lg:border-l-0",
            className,
          )}
        >
          <div
            aria-hidden="true"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center lg:hidden"
          >
            <span className="h-1 w-10 rounded bg-line-strong" />
          </div>
          <div className="flex items-start justify-between gap-4 px-4 pt-0 pb-2 lg:pt-4">
            <BaseDialog.Title className="text-ink">{title}</BaseDialog.Title>
            <BaseDialog.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />} />
          </div>
          {description ? <BaseDialog.Description className="px-4 pb-2 text-ink-muted">{description}</BaseDialog.Description> : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer ? <div className="flex shrink-0 justify-end gap-2 border-t border-line px-4 py-3">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
