import { Bell, Compass, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { buildPaletteModel, PaletteView } from "./index";
import type { PaletteViewProps } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";
import type { Command } from "./index";

export default {
  title: "Command palette",
  group: "Molecules",
  description:
    "The palette surface rendered statically: grouped results with matched characters highlighted, shortcut hints, nested views with a breadcrumb, an inline error row and the empty state. Live behaviour needs the provider; see the Command trigger entry.",
} satisfies StoryDefault;

const noop = () => undefined;

const commands: Command[] = [
  { id: "new", title: "New item", group: "Items", icon: Plus, shortcut: "mod+shift+n", run: noop },
  { id: "delete", title: "Delete item", group: "Items", icon: Trash2, run: noop },
  { id: "move", title: "Move to...", group: "Items", children: [], run: noop },
  { id: "home", title: "Home", group: "Go to", icon: Compass, shortcut: "g h", run: noop },
  { id: "items", title: "Items", group: "Go to", icon: Compass, shortcut: "g i", run: noop },
  { id: "alerts", title: "Notifications", group: "General", icon: Bell, run: noop },
];

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="w-[min(40rem,100%)] panel text-ink">{children}</div>;
}

function Static(props: Partial<PaletteViewProps> & { initialQuery?: string; recents?: string[]; breadcrumb?: string[] }) {
  const [query, setQuery] = useState(props.initialQuery ?? "");
  const [active, setActive] = useState(0);
  const model = buildPaletteModel({
    query,
    commands: props.breadcrumb?.length ? commands.slice(0, 2) : commands,
    recents: props.recents ?? [],
    root: !props.breadcrumb?.length,
  });
  return (
    <Frame>
      <PaletteView
        id="story"
        model={model}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setActive(0);
        }}
        placeholder="Type a command or search"
        activeIndex={Math.min(active, model.rows.length - 1)}
        onActiveChange={setActive}
        onSelect={noop}
        breadcrumb={[]}
        onBreadcrumb={noop}
        pendingId={null}
        error={null}
        {...props}
      />
    </Frame>
  );
}

export const Default = () => <Static />;
Default.storyMeta = { description: "Empty query: every command grouped." } satisfies StoryMeta;

export const WithRecents = () => <Static recents={["items", "new"]} />;
WithRecents.storyMeta = { description: "Recents come first on an empty query." } satisfies StoryMeta;

export const Searching = () => <Static initialQuery="nwi" />;
Searching.storyMeta = { description: "Fuzzy match: the matched characters are highlighted.", state: "focus" } satisfies StoryMeta;

export const NestedView = () => <Static breadcrumb={["Move to..."]} />;
NestedView.storyMeta = { description: "A command with children opens a view; Backspace on an empty query goes back." } satisfies StoryMeta;

export const Loading = () => <Static pendingId="new" />;
Loading.storyMeta = { description: "An async command shows a spinner in its row.", state: "loading" } satisfies StoryMeta;

export const ErrorRow = () => <Static error={{ title: "Delete item", message: "The server said no" }} />;
ErrorRow.storyMeta = { description: "A failed command reports inline, without a toast.", state: "error" } satisfies StoryMeta;

export const NoResults = () => <Static initialQuery="qqzzxx" />;
NoResults.storyMeta = { description: "Apps without the assistant show only this." } satisfies StoryMeta;

export const Narrow = () => (
  <div className="w-[22rem] max-w-full">
    <Static />
  </div>
);
Narrow.storyMeta = {
  description: "In a narrow container. Below 640px the live palette is a full-height sheet with 44px rows; a story cannot change the viewport.",
} satisfies StoryMeta;
