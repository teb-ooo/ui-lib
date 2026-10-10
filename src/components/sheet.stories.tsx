import { useState } from "react";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";
import { Select } from "./select";
import { Sheet } from "./sheet";
import { Slider } from "./slider";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Sheet",
  group: "Molecules",
  description:
    "A panel that holds controls without leaving the page: on a phone a reversed bottom panel with a drag handle (drag it down to close), above a phone a side panel. Modal by default; modal=false leaves the page usable beside it with no backdrop, for a control panel next to a live view. Title, close button, optional description and footer; focus returns to the trigger; Escape closes.",
  aliases: ["bottom sheet", "side panel", "drawer", "slide over", "action sheet", "inspector panel", "control panel", "off canvas"],
  component: "Sheet",
  source: "src/components/sheet.tsx",
} satisfies StoryDefault;

export const Modal = () => (
  <Sheet trigger={<Button>Open sheet</Button>} title="Filters" description="Choose how the list is filtered." footer={<Button intent="solid">Apply</Button>}>
    <p className="text-ink-muted">A reversed bottom panel on a phone, a side panel above it.</p>
  </Sheet>
);
Modal.storyMeta = { description: "Modal: the page is dimmed and blocked until it closes." } satisfies StoryMeta;

export const NonModal = () => {
  const [volume, setVolume] = useState(40);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">The page stays usable while the sheet is open: {volume} %.</p>
      <Sheet modal={false} trigger={<Button>Open controls</Button>} title="Controls" side="right">
        <Slider label="Volume" value={volume} onValueChange={setVolume} unit="%" />
      </Sheet>
    </div>
  );
};
NonModal.storyMeta = { description: "modal=false: no backdrop, no blocking; it closes on Escape or its close button, not on a click outside." } satisfies StoryMeta;

export const Stacked = () => {
  const [status, setStatus] = useState<string | null>("open");
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Sheet trigger={<Button>Open sheet</Button>} title="Ticket" description="On a phone, a select and a confirmation open as panels in front of this one.">
        <div className="flex flex-col gap-3 py-2">
          <Select label="Status" value={status} onValueChange={setStatus} options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]} />
          <Button intent="danger" onClick={() => setConfirm(true)}>
            Delete ticket
          </Button>
        </div>
      </Sheet>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Delete this ticket?" confirmLabel="Delete" danger onConfirm={() => undefined} />
    </>
  );
};
Stacked.storyMeta = { description: "Panels stack like toasts: open the select or the delete confirmation on a phone and the sheet sits behind it, a little smaller and higher." } satisfies StoryMeta;
