import { CommandProvider, CommandTrigger } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Command trigger",
  group: "Molecules",
  description:
    "The button that opens the command palette: search icon, label and shortcut hint on desktop, an icon-only square button below 640px. Mount it in the app header.",
  component: "CommandTrigger",
  source: "src/cmdk/command-trigger.tsx",
} satisfies StoryDefault;

export const Desktop = () => (
  <CommandProvider>
    <CommandTrigger />
  </CommandProvider>
);
Desktop.storyMeta = {
  description: "At 640px and wider: icon, label and the Cmd+K / Ctrl+K hint. Click it, or press the shortcut, to open the palette.",
  state: "default",
} satisfies StoryMeta;

export const InHeader = () => (
  <CommandProvider>
    <div className="flex w-full items-center justify-between gap-4 border-b border-line px-3 py-2">
      <span>hello</span>
      <CommandTrigger />
    </div>
  </CommandProvider>
);
InHeader.storyMeta = { description: "As placed in an app header. Resize below 640px to see the icon-only form.", background: "surface" } satisfies StoryMeta;
