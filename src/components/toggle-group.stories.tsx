import { useState } from "react";
import { ToggleGroup } from "./toggle-group";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "ToggleGroup",
  group: "Atoms",
  description: "A group of toggle chips for facets: choose one (choose it again to clear) or, with multiple, any number. Each chip may show a count.",
  component: "ToggleGroup",
  source: "src/components/toggle-group.tsx",
} satisfies StoryDefault;

const options = [
  { value: "bug", label: "Bug", count: 8 },
  { value: "feature", label: "Feature", count: 3 },
  { value: "chore", label: "Chore", count: 21 },
];

export const Single = () => {
  const [value, setValue] = useState<string | null>("bug");
  return <ToggleGroup label="Type" options={options} value={value} onValueChange={setValue} />;
};

export const Multiple = () => {
  const [value, setValue] = useState<string[]>(["bug", "chore"]);
  return <ToggleGroup multiple label="Type" options={options} value={value} onValueChange={setValue} />;
};
Multiple.storyMeta = { description: "Any number can be on." } satisfies StoryMeta;
