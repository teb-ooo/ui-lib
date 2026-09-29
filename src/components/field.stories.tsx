import { Field } from "./field";
import { Input } from "./input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Field",
  group: "Molecules",
  description: "Label, control, description and error, wired together for assistive technology.",
  component: "Field",
  source: "src/components/field.tsx",
} satisfies StoryDefault;

export const Default = () => (
  <Field label="Username">
    <Input />
  </Field>
);
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const WithDescription = () => (
  <Field label="Username" description="3 to 32 characters">
    <Input defaultValue="alex" />
  </Field>
);

export const WithError = () => (
  <Field label="Email" error="Enter a valid email address">
    <Input defaultValue="alex@" />
  </Field>
);
WithError.storyMeta = { state: "error" } satisfies StoryMeta;

export const Disabled = () => (
  <Field label="Username" disabled>
    <Input defaultValue="alex" />
  </Field>
);
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;
