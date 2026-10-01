import { useState } from "react";
import { Button } from "./button";
import { SplitPane } from "./split-pane";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "SplitPane",
  group: "Molecules",
  description:
    "List and detail. From the lg breakpoint they sit side by side, with an optional draggable divider; below it the list fills the screen and an open detail becomes a full-screen sheet.",
  component: "SplitPane",
  source: "src/components/split-pane.tsx",
} satisfies StoryDefault;

const items = ["Fix login redirect", "Write release notes", "Upgrade Base UI", "Add dark screenshots"];

function Demo({ resizable, persistKey }: { resizable: boolean; persistKey?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="panel h-80 overflow-hidden">
      <SplitPane
        resizable={resizable}
        {...(persistKey ? { persistKey } : {})}
        defaultSize={16}
        minSize={10}
        maxSize={30}
        detailLabel="Item detail"
        placeholder="Choose an item to see it here."
        detailOpen={open !== null}
        onDetailClose={() => setOpen(null)}
        list={
          <ul className="flex flex-col gap-1 p-2">
            {items.map((i) => (
              <li key={i}>
                <Button active={open === i} className="w-full justify-start" onClick={() => setOpen(i)}>
                  {i}
                </Button>
              </li>
            ))}
          </ul>
        }
        detail={<p className="text-ink">{open}</p>}
      />
    </div>
  );
}

export const Default = () => <Demo resizable={false} />;
Default.storyMeta = { description: "Fixed list width. On a phone, choosing an item opens the sheet." } satisfies StoryMeta;

export const Resizable = () => <Demo resizable />;
Resizable.storyMeta = { description: "Drag the divider, or focus it and use the arrow keys, Home and End." } satisfies StoryMeta;

export const RemembersWidth = () => <Demo resizable persistKey="gallery-split" />;
RemembersWidth.storyMeta = {
  description: "With persistKey the dragged width is kept in this browser and restored on reload; double-click the divider to reset it.",
} satisfies StoryMeta;
