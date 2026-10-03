import { useState } from "react";
import { Chip } from "./chip";
import { Combobox } from "./combobox";
import { FilterBar } from "./filter-bar";
import { SearchInput } from "./search-input";
import { Select } from "./select";
import { ToggleGroup } from "./toggle-group";
import { ViewMenu } from "./view-menu";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FilterBar",
  group: "Molecules",
  description:
    "A row of filter controls. Put the search and the main action in `primary` and the filters in the children: on a phone it is one row and the filters open in a sheet behind a Filters button. Without `primary` the row just wraps.",
  aliases: ["filters", "toolbar", "facets", "search bar", "query builder", "faceted search"],
  component: "FilterBar",
  source: "src/components/filter-bar.tsx",
} satisfies StoryDefault;

const labels = ["bug", "docs", "design", "infra", "security"].map((l) => ({ value: l, label: l, count: l.length * 3 }));

export const Composed = () => {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string[]>(["bug"]);
  const [owner, setOwner] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  return (
    <FilterBar
      aria-label="Filter tasks"
      end={
        <>
          <Chip tone="muted">42 tasks</Chip>
          <ViewMenu views={[{ id: "mine", name: "Mine" }]} activeId={null} onSelect={() => undefined} />
        </>
      }
    >
      <SearchInput value={q} onValueChange={setQ} placeholder="Search tasks" />
      <ToggleGroup
        multiple
        label="Type"
        options={[
          { value: "bug", label: "Bug" },
          { value: "feature", label: "Feature" },
        ]}
        value={type}
        onValueChange={setType}
      />
      <Select
        label="Owner"
        options={[
          { value: "ada", label: "Ada" },
          { value: "grace", label: "Grace" },
        ]}
        value={owner}
        onValueChange={setOwner}
      />
      <Combobox multiple label="Labels" options={labels} value={tags} onValueChange={setTags} />
    </FilterBar>
  );
};
Composed.storyMeta = { description: "Search, facet chips, a select, a multi combobox, and a count with views at the end." } satisfies StoryMeta;

export const OneRowOnAPhone = () => {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string | null>("bug");
  return (
    <FilterBar
      aria-label="Filter issues"
      primary={<SearchInput value={q} onValueChange={setQ} placeholder="Search issues" />}
      end={<Chip tone="muted">12 issues</Chip>}
      activeCount={type === null ? 0 : 1}
    >
      <ToggleGroup
        label="Type"
        options={[
          { value: "bug", label: "Bug" },
          { value: "feature", label: "Feature" },
        ]}
        value={type}
        onValueChange={setType}
      />
    </FilterBar>
  );
};
OneRowOnAPhone.storyMeta = { description: "With primary, the search stays and the filters move into a sheet behind a Filters button below the sm breakpoint." } satisfies StoryMeta;
