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

export const WithForm = () => (
  <Dialog
    trigger={<Button>Rename</Button>}
    title="Rename"
    footer={<Button intent="solid">Save</Button>}
  >
    <Field label="Name">
      <Input defaultValue="Laptop" />
    </Field>
  </Dialog>
);
WithForm.storyMeta = { description: "A dialog holding a Field." } satisfies StoryMeta;

export const TopPlacement = () => (
  <Dialog
    placement="top"
    trigger={<Button>Open at top</Button>}
    title="Search"
    description="A wider panel near the top of the viewport."
  />
);
TopPlacement.storyMeta = { description: "placement=top: the shape a command palette uses." } satisfies StoryMeta;

export const Bare = () => (
  <Dialog placement="top" bare trigger={<Button>Open bare</Button>} title="Palette">
    <div className="p-4 text-ink-muted">Content fills the panel; the title is announced only.</div>
  </Dialog>
);
Bare.storyMeta = { description: "bare: no padding, header or close control." } satisfies StoryMeta;
