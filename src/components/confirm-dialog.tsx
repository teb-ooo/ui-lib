import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

export interface ConfirmDialogProps {
  open: boolean;
  /** Called with `false` when the person cancels, presses Escape or clicks outside. */
  onOpenChange: (open: boolean) => void;
  /** The question, as a short sentence: "Delete this note?". */
  title: ReactNode;
  /** What it will do, and whether it can be undone. */
  description?: ReactNode;
  /** The confirming action as a verb: "Delete". @default "Confirm" */
  confirmLabel?: string;
  /** @default "Cancel" */
  cancelLabel?: string;
  /** The action destroys something: the confirm button is red. @default false */
  danger?: boolean;
  /** Runs when confirmed. While it runs (a promise) the button shows a spinner and both buttons wait; the dialog closes when it finishes, and stays open with the error thrown to the caller if it rejects. */
  onConfirm: () => void | Promise<void>;
}

/**
 * Asks before something that cannot easily be undone. A `Dialog` with a question, a quiet Cancel and the confirming action
 * (red when `danger`); focus starts on Cancel, so Enter does not destroy by accident. Use it instead of `window.confirm`
 * and instead of building the same two-button footer in each app.
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const cancel = useRef<HTMLButtonElement | null>(null);
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!busy) onOpenChange(o);
      }}
      title={title}
      initialFocus={cancel}
      {...(description !== undefined ? { description } : {})}
      footer={
        <>
          <Button ref={cancel} disabled={busy} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button intent={danger ? "danger" : "solid"} loading={busy} onClick={() => void run()}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
