import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { PanelHandle, panelDepthStyle, usePanelDrag, usePanelStyle, usePanelsAbove, usePhone } from "../lib/bottom-panel";
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
  /** Above a phone the sheet is a panel on this side; on a phone it is a reversed bottom panel. @default "right" */
  side?: "left" | "right";
  /** Label of the close button. @default "Close" */
  closeLabel?: string;
  /** Layout classes for the panel (its width from lg, for example `lg:w-[28rem]`). */
  className?: string;
}

/**
 * A panel that holds controls without leaving the page: on a phone a reversed bottom panel with a drag handle (drag it down to close),
 * above a phone a side panel. Modal by default; `modal={false}` keeps the page usable beside it. It has a title,
 * a close button, optional description and footer, returns focus to its trigger and closes on Escape.
 */
export function Sheet({ open, defaultOpen, onOpenChange, trigger, title, description, children, footer, modal = true, side = "right", closeLabel = "Close", className }: SheetProps) {
  const portalContainer = usePortalContainer();
  const phone = usePhone();
  const panelStyle = usePanelStyle();
  const [internal, setInternal] = useState(defaultOpen ?? false);
  const shown = open ?? internal;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };
  const above = usePanelsAbove(phone && shown);
  const drag = usePanelDrag(() => setOpen(false));
  return (
    <BaseDialog.Root open={shown} onOpenChange={(o) => setOpen(o)} modal={modal} disablePointerDismissal={!modal}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal container={portalContainer}>
        {modal ? <BaseDialog.Backdrop forceRender className="anim-backdrop fixed inset-0 z-50 bg-black/50" /> : null}
        <BaseDialog.Popup
          data-side={side}
          style={phone ? { ...panelStyle, left: 0, right: 0, ...(drag.style ?? panelDepthStyle(above)) } : undefined}
          className={
            phone
              ? // a phone: a reversed panel from the bottom, stacked like toasts
                "anim-panel panel-inverse panel-float fixed z-50 flex max-h-[85dvh] w-full flex-col rounded-b-none border-b-0 text-ink outline-none"
              : // otherwise: a full-height side panel
                cn("anim-sheet panel panel-float fixed inset-y-0 z-50 flex w-96 flex-col rounded-none border-y-0 text-ink outline-none", side === "right" ? "right-0 left-auto border-r-0" : "left-0 right-auto border-l-0", className)
          }
        >
          {phone ? <PanelHandle {...drag.handle} /> : null}
          <div className={cn("flex items-start justify-between gap-4 px-4 pb-2", phone ? "pt-0" : "pt-4")}>
            <BaseDialog.Title className="text-ink">{title}</BaseDialog.Title>
            <BaseDialog.Close render={<Button icon={<X aria-hidden="true" className="size-4" />} aria-label={closeLabel} className="border-transparent" />} />
          </div>
          {description ? <BaseDialog.Description className="px-4 pb-2 text-ink-muted">{description}</BaseDialog.Description> : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
          {footer ? <div className="flex shrink-0 justify-end gap-2 border-t border-line px-4 py-3">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
