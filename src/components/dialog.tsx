import type { ReactElement, ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

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
  /** Label for the close control, for localisation. */
  closeLabel?: string;
  className?: string;
}

export function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  closeLabel = "Close",
  className,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-ink/40" />
        <BaseDialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            "flex flex-col gap-4 rounded-ctl border border-line bg-ground p-6 font-sans text-ink outline-none",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <BaseDialog.Title className="text-lg">{title}</BaseDialog.Title>
            <BaseDialog.Close
              aria-label={closeLabel}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-ctl text-muted outline-none hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X aria-hidden="true" className="size-4" />
            </BaseDialog.Close>
          </div>
          {description ? (
            <BaseDialog.Description className="text-base text-muted">{description}</BaseDialog.Description>
          ) : null}
          {children}
          {footer ? <div className="flex justify-end gap-2">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
