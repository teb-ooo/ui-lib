import { useState } from "react";
import { SearchInput } from "./search-input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "SearchInput",
  group: "Atoms",
  description: "Search box with a clear button; Escape clears it too. Its ref reaches the input, so an app can focus it from a shortcut such as /.",
  aliases: ["search box", "search field", "find", "query", "clearable input", "search bar"],
  component: "SearchInput",
  source: "src/components/search-input.tsx",
} satisfies StoryDefault;

export const Empty = () => {
  const [value, setValue] = useState("");
  return <SearchInput value={value} onValueChange={setValue} placeholder="Search tasks" />;
};
Empty.storyMeta = { state: "default" } satisfies StoryMeta;

export const WithText = () => {
  const [value, setValue] = useState("redirect");
  return <SearchInput value={value} onValueChange={setValue} />;
};
WithText.storyMeta = { description: "The clear button appears once there is text." } satisfies StoryMeta;
