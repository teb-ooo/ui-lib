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
