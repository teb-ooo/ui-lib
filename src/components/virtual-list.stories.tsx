import { useRef, useState } from "react";
import { Button } from "./button";
import { VirtualList } from "./virtual-list";
import type { VirtualListHandle } from "./virtual-list";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "VirtualList",
  group: "Molecules",
  description:
    "A list that draws only the items on screen, so ten thousand items cost the same as thirty. It knows nothing about what an item looks like: you give renderItem. Items are one height (itemHeight, exact) or of different heights, measured as they are drawn. A list of listitems with their position set for assistive technology. DataTable windows its rows the same way (its virtualize prop); use VirtualList for anything that is not a table.",
  aliases: ["virtual scroll", "windowing", "infinite list", "long list", "virtualized", "recycler", "list view"],
  component: "VirtualList",
  source: "src/components/virtual-list.tsx",
} satisfies StoryDefault;

const rows = Array.from({ length: 10_000 }, (_, i) => ({ id: `n${i}`, text: `Message ${i + 1}` }));

export const Fixed = () => (
  <VirtualList
    label="Messages"
    items={rows}
    itemKey={(r) => r.id}
    itemHeight={36}
    renderItem={(r) => <div className="flex h-9 items-center border-b border-line px-3">{r.text}</div>}
    className="h-72 w-full max-w-lg rounded border border-line"
  />
);
Fixed.storyMeta = { description: "Ten thousand items of one height: itemHeight makes the maths exact, and only about a dozen are in the page." } satisfies StoryMeta;

const words = "the quick brown fox jumps over the lazy dog and keeps going until the line has to wrap onto another".split(" ");
const notes = Array.from({ length: 5_000 }, (_, i) => ({ id: `m${i}`, text: `${i + 1}. ${words.slice(0, 3 + ((i * 7) % 15)).join(" ")}` }));

export const Measured = () => (
  <VirtualList
    label="Notes"
    items={notes}
    itemKey={(r) => r.id}
    estimatedItemHeight={44}
    renderItem={(r) => <p className="border-b border-line px-3 py-2">{r.text}</p>}
    className="h-72 w-full max-w-sm rounded border border-line"
  />
);
Measured.storyMeta = { description: "No itemHeight: items wrap to different heights and each is measured as it is drawn; estimatedItemHeight stands in until then." } satisfies StoryMeta;

export const ScrollTo = () => {
  const list = useRef<VirtualListHandle>(null);
  const [n, setN] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button onClick={() => list.current?.scrollToIndex(5000, "center")}>Go to 5001</Button>
        <Button onClick={() => list.current?.scrollToIndex(0, "start")}>Top</Button>
        <span className="self-center text-ink-muted">{n} loads</span>
      </div>
      <VirtualList
        ref={list}
        label="Rows"
        items={rows}
        itemKey={(r) => r.id}
        itemHeight={36}
        onEndReached={() => setN((v) => v + 1)}
        renderItem={(r) => <div className="flex h-9 items-center border-b border-line px-3">{r.text}</div>}
        className="h-56 w-full max-w-lg rounded border border-line"
      />
    </div>
  );
};
ScrollTo.storyMeta = { description: "The ref's scrollToIndex(index, 'nearest' | 'start' | 'center'); onEndReached is called once per length of the list when the scroll nears the end." } satisfies StoryMeta;
