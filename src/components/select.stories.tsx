import { useState } from "react";
import { Select } from "./select";
import type { Option } from "./select";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Select",
  group: "Atoms",
  description: "Choose one option from a short list. For long lists that need searching, use Combobox.",
  aliases: ["dropdown", "drop down", "picker", "listbox", "choose one", "menu", "option list"],
  component: "Select",
  source: "src/components/select.tsx",
} satisfies StoryDefault;

const options: Option[] = [
  { value: "open", label: "Open", count: 12 },
  { value: "progress", label: "In progress", count: 4 },
  { value: "closed", label: "Closed", count: 87 },
];

export const Default = () => {
  const [value, setValue] = useState<string | null>(null);
  return <Select label="Status" options={options} value={value} onValueChange={setValue} />;
};
Default.storyMeta = { state: "default", description: "The label is the accessible name and the placeholder." } satisfies StoryMeta;

export const Chosen = () => {
  const [value, setValue] = useState<string | null>("progress");
  return <Select label="Status" options={options} value={value} onValueChange={setValue} />;
};

export const Disabled = () => <Select label="Status" options={options} value={null} onValueChange={() => undefined} disabled />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const WithAdornment = () => {
  const [value, setValue] = useState<string | null>("open");
  return <Select label="Status" startAdornment="IS" options={options} value={value} onValueChange={setValue} />;
};
WithAdornment.storyMeta = { description: "startAdornment (and endAdornment): muted text inside the border before the chosen value. The select's label still names it." } satisfies StoryMeta;

export const WithTips = () => {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Select
      label="Map"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "plain", label: "Plain", tip: "A flat open field: nothing to hide behind, so every shot is seen." },
        { value: "hills", label: "Hills", tip: "Rolling ground with a few ridges. Good cover on the slopes; slower to cross." },
        { value: "none", label: "Empty" },
      ]}
    />
  );
};
WithTips.storyMeta = { description: "An option's tip is a sentence beside the highlighted option in the open list: no delay, also as the arrow keys move; an option with none shows none. It wraps at 20rem. Combobox takes the same." } satisfies StoryMeta;

export const WithOptionAdornments = () => {
  const [value, setValue] = useState<string | null>("ember");
  const swatch = (from: string, to: string) => <span className="w-24" style={{ background: `linear-gradient(to right, var(--color-${from}), var(--color-${to}))` }} />;
  return (
    <Select
      label="Colour preset"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "ember", label: "Ember", adornment: swatch("danger-500", "warning-300") },
        { value: "lagoon", label: "Lagoon", adornment: swatch("link-700", "ok-300") },
        { value: "plain", label: "Plain" },
      ]}
      className="w-72"
    />
  );
};
WithOptionAdornments.storyMeta = { description: "An option's adornment is drawn at the left edge of its row, edge to edge, and at the start of the closed select for the chosen option. Give it its own width; it is decoration, so the label says what it is. Combobox takes the same." } satisfies StoryMeta;

export const GroupsAndDisabled = () => {
  const [added, setAdded] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Add a filter"
        placeholder="Add a filter"
        value={null}
        onValueChange={(v) => v && setAdded((a) => [...a, v])}
        options={[
          { value: "median", label: "Median", group: "Denoise" },
          { value: "bilateral", label: "Bilateral", group: "Denoise" },
          { value: "unsharp", label: "Unsharp mask", group: "Sharpen", tip: "Sharpens edges." },
          { value: "deblur", label: "Deblur", group: "Sharpen", disabled: true, tip: "At most 8 filters." },
          { value: "gamma", label: "Gamma", group: "Exponent" },
        ]}
      />
      <p className="text-ink-muted">Added: {added.length ? added.join(", ") : "none"}</p>
    </div>
  );
};
GroupsAndDisabled.storyMeta = { description: "group puts consecutive options under a quiet heading; disabled is inert but reachable, so its tip can say why. With value null it is an action dropdown: the trigger keeps its placeholder." } satisfies StoryMeta;
