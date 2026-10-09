import { Field } from "./field";
import { Input } from "./input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Input",
  group: "Atoms",
  description: "Single-line text input. Put it inside a Field to get a label, description and error.",
  aliases: ["text field", "textbox", "text input", "form input", "entry"],
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

export const WithAdornments = () => (
  <div className="flex w-64 flex-col gap-3">
    <Field label="Low edge" hideLabel>
      <Input startAdornment="LO" placeholder="0.0" />
    </Field>
    <Field label="Price" hideLabel>
      <Input startAdornment="$" endAdornment="USD" placeholder="0.00" />
    </Field>
  </div>
);
WithAdornments.storyMeta = { description: "startAdornment and endAdornment: muted text or an icon inside the border, before or after the typing. Hidden from assistive technology; the field's label (here kept for screen readers with hideLabel) names the control. Pressing on an adornment focuses the input." } satisfies StoryMeta;
