import { useState } from "react";
import { ViewMenu } from "./view-menu";
import type { SavedView } from "./view-menu";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "ViewMenu",
  group: "Molecules",
  description:
    "Saved filter views. It lists them, asks for a name when saving and reports choices; the app stores the views and knows what each one filters.",
  aliases: ["saved views", "saved filters", "bookmarks", "presets", "view switcher", "views dropdown"],
  component: "ViewMenu",
  source: "src/components/view-menu.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [views, setViews] = useState<SavedView[]>([
    { id: "mine", name: "My open tasks" },
    { id: "urgent", name: "Urgent" },
  ]);
  const [active, setActive] = useState<string | null>(null);
  return (
    <ViewMenu
      views={views}
      activeId={active}
      onSelect={setActive}
      onSave={(name) => {
        const id = `v${views.length + 1}`;
        setViews([...views, { id, name }]);
        setActive(id);
      }}
      onDelete={(id) => {
        setViews(views.filter((v) => v.id !== id));
        setActive(null);
      }}
    />
  );
};
Default.storyMeta = { description: "Choose a view, save the current one, or delete the active one." } satisfies StoryMeta;

export const ReadOnly = () => <ViewMenu views={[{ id: "a", name: "Everything" }]} activeId="a" onSelect={() => undefined} />;
ReadOnly.storyMeta = { description: "Without onSave and onDelete it only switches views." } satisfies StoryMeta;
