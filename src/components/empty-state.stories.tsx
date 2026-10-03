import { Button } from "./button";
import { EmptyState } from "./empty-state";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "EmptyState",
  group: "Molecules",
  description:
    "The state of a list with nothing to show. Say why: filtered to nothing (name the filter, offer Clear filters) or really empty (say how to add the first). Use it as DataTable's empty or inside a pane.",
  aliases: ["empty", "no results", "nothing here", "no data", "zero state", "filtered to nothing", "clear filters", "empty list"],
  component: "EmptyState",
  source: "src/components/empty-state.tsx",
} satisfies StoryDefault;

export const Filtered = () => (
  <EmptyState title="No retired rules" description="The Retired filter is on and nothing matches it." action={<Button>Clear filters</Button>} />
);
Filtered.storyMeta = { description: "Filtered to nothing: names the filter and offers the way out." } satisfies StoryMeta;

export const First = () => <EmptyState title="No notes yet" description="Write the first one with New note." action={<Button intent="solid">New note</Button>} />;
First.storyMeta = { description: "Really empty: says how to add the first item." } satisfies StoryMeta;
