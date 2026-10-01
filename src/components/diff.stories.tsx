import { Diff } from "./diff";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Diff",
  group: "Atoms",
  description: "Word-level difference between two texts: additions on a state ground and underlined, removals struck through. Pass two strings, or tokens you computed.",
  aliases: ["changes", "compare", "revision", "track changes", "version diff", "redline", "patch"],
  component: "Diff",
  source: "src/components/diff.tsx",
} satisfies StoryDefault;

const before = "Mira is a courier who carries letters between the river towns.";
const after = "Mira is a smuggler who carries maps and letters between the river towns.";

export const Inline = () => <Diff before={before} after={after} />;

export const Split = () => <Diff layout="split" before={before} after={after} beforeLabel="Revision 3" afterLabel="Current" />;
Split.storyMeta = { description: "Before and after side by side; stacked on a phone." } satisfies StoryMeta;

export const FromTokens = () => (
  <Diff
    tokens={[
      { kind: "same", text: "Kept " },
      { kind: "del", text: "old" },
      { kind: "add", text: "new" },
      { kind: "same", text: " words" },
    ]}
  />
);
FromTokens.storyMeta = { description: "tokens: a diff the app computed itself." } satisfies StoryMeta;
