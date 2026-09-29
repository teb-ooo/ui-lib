import { Button } from "./button";
import { Dialog } from "./dialog";
import { Field } from "./field";
import { Input } from "./input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Dialog",
  group: "Atoms",
  description: "Modal dialog with a title, optional description and footer. Focus moves in and returns on close.",
  component: "Dialog",
  source: "src/components/dialog.tsx",
} satisfies StoryDefault;

export const WithTrigger = () => (
  <Dialog
    trigger={<Button>Open dialog</Button>}
    title="Remove passkey"
    description="You will no longer be able to sign in with it."
    footer={<Button intent="danger">Remove</Button>}
  />
);
WithTrigger.storyMeta = { description: "Opens from its trigger." } satisfies StoryMeta;

export const OpenWithForm = () => (
  <Dialog
    defaultOpen
    title="Rename"
    footer={<Button intent="solid">Save</Button>}
  >
    <Field label="Name">
      <Input defaultValue="Laptop" />
    </Field>
  </Dialog>
);
OpenWithForm.storyMeta = { description: "Rendered already open, for screenshots." } satisfies StoryMeta;
