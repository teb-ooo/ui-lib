import { Kbd } from "./kbd";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Kbd",
  group: "Atoms",
  description: "Keyboard shortcut hint. `mod` shows the Command key on Apple platforms and Ctrl elsewhere.",
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
