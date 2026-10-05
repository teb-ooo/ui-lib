import { useState } from "react";
import { Checkbox } from "./checkbox";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Checkbox",
  group: "Atoms",
  description: "A checkbox with an indeterminate state, for row selection and multi-choice lists.",
  aliases: ["tick", "check", "check box", "multi select", "boolean"],
  component: "Checkbox",
  source: "src/components/checkbox.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [checked, setChecked] = useState(false);
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- the label wraps the Checkbox (a button); the rule cannot see it
    <label className="flex items-center gap-2 text-ink">
      <Checkbox checked={checked} onCheckedChange={setChecked} />
      Notify me
    </label>
  );
};
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const Checked = () => <Checkbox aria-label="Selected" defaultChecked />;

export const Indeterminate = () => <Checkbox aria-label="Some selected" checked indeterminate />;
Indeterminate.storyMeta = { description: "Some, not all, of a group is chosen." } satisfies StoryMeta;

export const Disabled = () => <Checkbox aria-label="Locked" disabled defaultChecked />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;
