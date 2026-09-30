import { Field } from "./field";
import { Textarea } from "./textarea";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Textarea",
  group: "Atoms",
  description: "Multi-line text input. Put it inside a Field for a label, description and error; it resizes vertically only.",
  component: "Textarea",
  source: "src/components/textarea.tsx",
} satisfies StoryDefault;

export const Default = () => <Textarea aria-label="Notes" placeholder="Write a note" />;
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const InField = () => (
  <Field label="Notes" description="Markdown is fine.">
    <Textarea defaultValue={"First line\nSecond line"} />
  </Field>
);
InField.storyMeta = { description: "The field's label names the textarea and its description is announced." } satisfies StoryMeta;

export const WithError = () => (
  <Field label="Notes" error="Notes are required.">
    <Textarea />
  </Field>
);
WithError.storyMeta = { state: "error" } satisfies StoryMeta;

export const Disabled = () => <Textarea aria-label="Notes" defaultValue="Read only for now" disabled />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;
