import type { StoryDefault } from "../../../src/stories";
import * as tokens from "../../../src/foundations/color.stories";
import { BothThemes } from "./both-themes";

export default {
  title: "Color tokens",
  group: "Foundations",
  description:
    "The semantic colour tokens, dark and light side by side. Ground is pure black or pure white; neutrals are zero-chroma grays; colour appears only as state: red (danger), amber (warning), emerald (ok), sky (link), violet (agent). Components name these tokens, never a palette step or a literal.",
} satisfies StoryDefault;

export const Neutrals = () => (
  <BothThemes>
    <tokens.Neutrals />
  </BothThemes>
);
Neutrals.storyMeta = { description: "Ground, surfaces and lines." };

export const Ink = () => (
  <BothThemes>
    <tokens.Ink />
  </BothThemes>
);
Ink.storyMeta = { description: "Text colours, strongest to faintest." };

export const State = () => (
  <BothThemes>
    <tokens.State />
  </BothThemes>
);
State.storyMeta = { description: "Each state colour with its hover, soft and line variants, tuned per ground." };
