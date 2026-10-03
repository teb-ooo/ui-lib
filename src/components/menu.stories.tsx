import { useState } from "react";
import { Copy, Download, Pencil, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Menu } from "./menu";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Menu",
  group: "Atoms",
  description:
    "A list of actions anchored to a trigger. Arrow keys move, Enter or Space chooses, a letter jumps to a row, Escape closes and focus returns to the trigger. Rows are actions (icon, shortcut hint, or destructive) or on/off choices; separators and headings group them. Use Popover for details and Select to choose a value.",
  aliases: ["dropdown menu", "context menu", "actions menu", "kebab menu", "overflow menu", "more actions", "options menu", "action list"],
  component: "Menu",
  source: "src/components/menu.tsx",
} satisfies StoryDefault;

export const Actions = () => (
  <Menu
    trigger={<Button>Actions</Button>}
    items={[
      { id: "edit", label: "Rename", icon: Pencil, onSelect: () => undefined, shortcut: "r" },
      { id: "copy", label: "Duplicate", icon: Copy, onSelect: () => undefined },
      { id: "sep", type: "separator" },
      { id: "delete", label: "Delete", icon: Trash2, danger: true, onSelect: () => undefined },
    ]}
  />
);

export const WithChoices = () => {
  const [grid, setGrid] = useState(true);
  const [wrap, setWrap] = useState(false);
  return (
    <Menu
      trigger={<Button>View</Button>}
      items={[
        { id: "h", type: "heading", label: "Show" },
        { id: "grid", type: "checkbox", label: "Grid lines", checked: grid, onCheckedChange: setGrid },
        { id: "wrap", type: "checkbox", label: "Wrap long text", checked: wrap, onCheckedChange: setWrap },
        { id: "sep", type: "separator" },
        { id: "export", label: "Export", icon: Download, onSelect: () => undefined, disabled: true },
      ]}
    />
  );
};
WithChoices.storyMeta = { description: "A heading, on/off rows and a disabled action." } satisfies StoryMeta;
