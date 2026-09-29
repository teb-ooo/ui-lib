import { Input } from "./input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Input",
  group: "Atoms",
  description: "Single-line text input. Put it inside a Field to get a label, description and error.",
  component: "Input",
  source: "src/components/input.tsx",
} satisfies StoryDefault;

export const Default = () => <Input aria-label="Name" placeholder="Name" />;
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const WithValue = () => <Input aria-label="Name" defaultValue="alex" />;

export const Disabled = () => <Input aria-label="Name" defaultValue="alex" disabled />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const Invalid = () => <Input aria-label="Name" defaultValue="a" aria-invalid="true" data-invalid="" />;
Invalid.storyMeta = { state: "error", description: "Normally set by an enclosing Field with an error." } satisfies StoryMeta;
