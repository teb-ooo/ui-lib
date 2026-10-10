import { useState } from "react";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";
import { Field } from "./field";
import { Input } from "./input";
import { Modal } from "./modal";
import { Select } from "./select";
import { Slider } from "./slider";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Modal",
  group: "Molecules",
  description:
    "The one thing drawn over the page that needs an answer or holds a task. Variants: dialog (centred), drawer (docked to a side) and top (wide, near the top). On a phone every variant is the same reversed bottom panel with a grab handle (drag it down to close). Title, close button, optional description and footer; focus moves in and returns on close; Escape closes. A modal opened from a modal, a select or a menu stacks in front of it.",
  aliases: ["dialog", "drawer", "sheet", "bottom sheet", "bottom panel", "side panel", "slide over", "action sheet", "inspector panel", "control panel", "off canvas", "popup", "overlay", "lightbox", "confirm", "alert dialog", "prompt"],
  component: "Modal",
  source: "src/components/modal.tsx",
} satisfies StoryDefault;

export const Dialog = () => (
  <Modal trigger={<Button>Open dialog</Button>} title="Remove passkey" description="You will no longer be able to sign in with it." footer={<Button intent="danger">Remove</Button>} />
);
Dialog.storyMeta = { description: "variant=dialog (the default): a small centred panel; a bottom panel on a phone." } satisfies StoryMeta;

export const WithForm = () => (
  <Modal trigger={<Button>Rename</Button>} title="Rename" footer={<Button intent="solid">Save</Button>}>
    <Field label="Name">
      <Input defaultValue="Laptop" />
    </Field>
  </Modal>
);
WithForm.storyMeta = { description: "Focus starts on the first field." } satisfies StoryMeta;

export const Drawer = () => (
  <Modal variant="drawer" trigger={<Button>Open drawer</Button>} title="Filters" description="Choose how the list is filtered." footer={<Button intent="solid">Apply</Button>}>
    <p className="text-ink-muted">A full-height panel docked to the right edge; a bottom panel on a phone.</p>
  </Modal>
);
Drawer.storyMeta = { description: "variant=drawer: docked to `side` (right by default)." } satisfies StoryMeta;

export const NonModalDrawer = () => {
  const [volume, setVolume] = useState(40);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">The page stays usable while the drawer is open: {volume} %.</p>
      <Modal variant="drawer" modal={false} trigger={<Button>Open controls</Button>} title="Controls">
        <Slider label="Volume" value={volume} onValueChange={setVolume} unit="%" />
      </Modal>
    </div>
  );
};
NonModalDrawer.storyMeta = { description: "modal=false: no backdrop, no blocking; it closes on Escape or its close button, not on a click outside." } satisfies StoryMeta;

export const Top = () => (
  <Modal variant="top" trigger={<Button>Open at top</Button>} title="Search" description="A wider panel near the top of the viewport." />
);
Top.storyMeta = { description: "variant=top: the shape a command palette uses." } satisfies StoryMeta;

export const Bare = () => (
  <Modal variant="top" bare trigger={<Button>Open bare</Button>} title="Palette">
    <div className="p-4 text-ink-muted">Content fills the panel; the title is announced only. A bare modal is never a bottom panel.</div>
  </Modal>
);
Bare.storyMeta = { description: "bare: no padding, header or close control." } satisfies StoryMeta;

export const Stacked = () => {
  const [status, setStatus] = useState<string | null>("open");
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Modal variant="drawer" trigger={<Button>Open drawer</Button>} title="Ticket" description="On a phone, a select and a confirmation open as panels in front of this one.">
        <div className="flex flex-col gap-3 py-2">
          <Select label="Status" value={status} onValueChange={setStatus} options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]} />
          <Button intent="danger" onClick={() => setConfirm(true)}>
            Delete ticket
          </Button>
        </div>
      </Modal>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Delete this ticket?" confirmLabel="Delete" danger onConfirm={() => undefined} />
    </>
  );
};
Stacked.storyMeta = { description: "Panels stack like toasts: open the select or the delete confirmation on a phone and the drawer sits behind it, a little smaller and higher." } satisfies StoryMeta;
