import { useState } from "react";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "ConfirmDialog",
  group: "Molecules",
  description:
    "Asks before something that cannot easily be undone: a question, a quiet Cancel and the confirming action (red when it destroys). Focus starts on Cancel. Use it instead of window.confirm and instead of building the two-button footer in each app.",
  aliases: ["confirm", "are you sure", "delete confirmation", "confirm dialog", "destructive action", "prompt before delete", "yes no dialog"],
  component: "ConfirmDialog",
  source: "src/components/confirm-dialog.tsx",
} satisfies StoryDefault;

export const Delete = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button intent="danger" onClick={() => setOpen(true)}>
        Delete note
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this note?"
        description="It is removed for everyone and cannot be restored."
        confirmLabel="Delete"
        danger
        onConfirm={() => new Promise<void>((done) => setTimeout(done, 600))}
      />
    </>
  );
};
Delete.storyMeta = { description: "A destructive confirm: the button spins while the action runs and the dialog closes when it is done." } satisfies StoryMeta;

export const Plain = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Publish</Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title="Publish this page?" confirmLabel="Publish" onConfirm={() => undefined} />
    </>
  );
};
Plain.storyMeta = { description: "A non-destructive confirm with a title only." } satisfies StoryMeta;
