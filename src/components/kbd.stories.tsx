import { Kbd } from "./kbd";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Kbd",
  group: "Atoms",
  description: "Keyboard shortcut hint. `mod` shows the Command key on Apple platforms and Ctrl elsewhere.",
  aliases: ["keyboard shortcut", "hotkey", "key", "keycap", "shortcut hint", "keybinding"],
  component: "Kbd",
  source: "src/components/kbd.tsx",
} satisfies StoryDefault;

export const Modifier = () => <Kbd shortcut="mod+k" />;
Modifier.storyMeta = { state: "default" } satisfies StoryMeta;

export const Chord = () => <Kbd shortcut="mod+shift+enter" />;

export const Sequence = () => <Kbd shortcut="g i" />;
Sequence.storyMeta = { description: "Space-separated steps read as a sequence." } satisfies StoryMeta;

export const Symbols = () => (
  <div className="flex flex-wrap gap-3">
    <Kbd shortcut="esc" />
    <Kbd shortcut="up" />
    <Kbd shortcut="down" />
    <Kbd shortcut="alt+left" />
    <Kbd shortcut="tab" />
  </div>
);

export const FreeText = () => <Kbd>Any key</Kbd>;
FreeText.storyMeta = { description: "Children override the shortcut prop." } satisfies StoryMeta;

export const ReactsToKeys = () => (
  <div className="flex flex-col gap-2">
    <Kbd shortcut="mod+k" />
    <Kbd shortcut="shift+enter" />
    <span className="text-ink-muted">Press them: each keycap darkens a touch and sits a pixel lower while its real key is down.</span>
  </div>
);
ReactsToKeys.storyMeta = { description: "Subtly alive: every keycap on the page notices its own key being pressed." } satisfies StoryMeta;
