import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Chip } from "./chip";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Reversal",
  group: "Atoms",
  description:
    "Reversed surfaces: white on a dark page, black on a light one. Give an element .reversed (reversed now: an active row), .hover-invert (while hovered), .reverses (hovered, dragged, focused or open) or .panel-inverse (a floating panel); buttons and inputs reverse by themselves when hovered or focused. Reversal is relative to what the element sits in: inside a reversed surface the content reads as the other theme, and a reversal inside it (a hovered button in a reversed row) restores the page's own look, one level deeper reverses again. Never write hover colours in a component, and never name a class invert: Tailwind's invert filter would invert the painted pixels again.",
  aliases: ["invert", "inversion", "reverse", "reversed", "inverted", "nested inversion", "active row", "hover invert", "opposite theme", "panel inverse"],
  source: "theme.css",
} satisfies StoryDefault;

export const Row = () => (
  <div className="flex flex-col">
    <div className="flex items-center gap-3 border-b border-line px-3 py-2 text-ink">
      <Checkbox aria-label="Select row one" />
      <span className="flex-1">A resting row</span>
      <Chip>open</Chip>
      <Button>Edit</Button>
    </div>
    <div data-testid="reversed-row" className="reversed flex items-center gap-3 border-b px-3 py-2">
      <Checkbox aria-label="Select row two" />
      <span className="flex-1">The active row, reversed</span>
      <Chip>open</Chip>
      <Button>Edit</Button>
    </div>
  </div>
);
Row.storyMeta = { description: "The active row of a table: its content is the other theme's, so the checkbox and the button are dark on white in a dark page. Hover the button: it reverses back, so it is light on dark, like a hovered button on the page." } satisfies StoryMeta;

export const Nested = () => (
  <div data-testid="level-1" className="reversed flex flex-col gap-3 p-3">
    <span>Level 1: reversed</span>
    <Button>Button on level 1</Button>
    <div data-testid="level-2" className="reversed flex flex-col gap-3 p-3">
      <span>Level 2: reversed inside a reversed surface, so the page's own look</span>
      <Button>Button on level 2</Button>
      <div data-testid="level-3" className="reversed flex flex-col gap-3 p-3">
        <span>Level 3: reversed again</span>
        <Button>Button on level 3</Button>
      </div>
    </div>
  </div>
);
Nested.storyMeta = { description: "Each reversal flips the one around it (six levels are written out, enough for a hovered button inside a surface three deep). Hover the buttons to see each level's own hover: it is the opposite of the surface it sits on." } satisfies StoryMeta;
