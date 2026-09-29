import { Plus, Trash2 } from "lucide-react";
import { Button } from "./button";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Button",
  group: "Atoms",
  description:
    "The only button. Default is outlined, solid is the one primary action, danger and warning tint the text. Icon, active state and tooltip are props.",
  component: "Button",
  source: "src/components/button.tsx",
} satisfies StoryDefault;

export const Default = () => <Button>Save</Button>;
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const Solid = () => <Button intent="solid">Save</Button>;
Solid.storyMeta = { description: "The primary action; use one per view." } satisfies StoryMeta;

export const Danger = () => <Button intent="danger">Remove</Button>;

export const Warning = () => <Button intent="warning">Discard changes</Button>;

export const Active = () => <Button active>Filter</Button>;
Active.storyMeta = { description: "A toggled-on button; sets aria-pressed." } satisfies StoryMeta;

export const WithIcon = () => <Button icon={<Plus aria-hidden="true" className="size-4" />}>New item</Button>;

export const IconOnly = () => <Button icon={<Trash2 aria-hidden="true" className="size-4" />} intent="danger" tip="Delete" />;
IconOnly.storyMeta = { description: "No children: a square button whose tip is its accessible name." } satisfies StoryMeta;

export const WithTip = () => <Button tip="Saves the current draft">Save</Button>;
WithTip.storyMeta = { description: "Hover or focus to see the tooltip." } satisfies StoryMeta;

export const Add = () => (
  <Button dashed icon={<Plus aria-hidden="true" className="size-4" />}>
    add
  </Button>
);
Add.storyMeta = { description: "The dashed add affordance." } satisfies StoryMeta;

export const Disabled = () => <Button disabled>Save</Button>;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const Loading = () => (
  <Button intent="solid" loading>
    Saving
  </Button>
);
Loading.storyMeta = { state: "loading", description: "Busy and not clickable, but still focusable." } satisfies StoryMeta;
