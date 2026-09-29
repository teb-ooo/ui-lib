import { Button } from "./button";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Button",
  group: "Atoms",
  description: "The only button. Default is outlined, solid is the one primary action, danger is destructive.",
  component: "Button",
  source: "src/components/button.tsx",
} satisfies StoryDefault;

export const Default = () => <Button>Save</Button>;
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const Solid = () => <Button intent="solid">Save</Button>;
Solid.storyMeta = { description: "The primary action; use one per view." } satisfies StoryMeta;

export const Danger = () => <Button intent="danger">Remove</Button>;

export const Disabled = () => <Button disabled>Save</Button>;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const Loading = () => (
  <Button intent="solid" loading>
    Saving
  </Button>
);
Loading.storyMeta = { state: "loading", description: "Busy and not clickable, but still focusable." } satisfies StoryMeta;
