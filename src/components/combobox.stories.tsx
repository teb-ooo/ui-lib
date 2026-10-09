import { useState } from "react";
import { Combobox } from "./combobox";
import type { Option } from "./select";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Combobox",
  group: "Atoms",
  description:
    "A search-as-you-type list for long option lists such as assignees or labels. Single choice, or multiple with the chosen options shown as chips. Options may carry a count.",
  aliases: ["autocomplete", "typeahead", "autosuggest", "searchable select", "dropdown", "multi select", "picker"],
  component: "Combobox",
  source: "src/components/combobox.tsx",
} satisfies StoryDefault;

const people: Option[] = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton", "Alan Turing", "Barbara Liskov", "Donald Knuth"].map(
  (name, i) => ({
    value: name.toLowerCase().replace(" ", "-"),
    label: name,
    count: (i * 7) % 13,
  }),
);

export const Single = () => {
  const [value, setValue] = useState<string | null>(null);
  return <Combobox label="Assignee" options={people} value={value} onValueChange={setValue} />;
};
Single.storyMeta = { description: "Type to filter; the arrow keys and Enter choose." } satisfies StoryMeta;

export const Multiple = () => {
  const [value, setValue] = useState<string[]>(["ada-lovelace", "alan-turing"]);
  return <Combobox multiple label="Assignees" options={people} value={value} onValueChange={setValue} />;
};
Multiple.storyMeta = { description: "Each chosen option is a chip with a remove button; Backspace removes the last." } satisfies StoryMeta;

export const Disabled = () => <Combobox label="Assignee" options={people} value={null} onValueChange={() => undefined} disabled />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const WithAdornment = () => {
  const [value, setValue] = useState<string | null>(null);
  return <Combobox label="Assignee" startAdornment="TO" options={people} value={value} onValueChange={setValue} />;
};
WithAdornment.storyMeta = { description: "startAdornment (and endAdornment): muted text inside the border before the typing; for multiple, before the chips." } satisfies StoryMeta;
