import { Button } from "./button";
import { Popover } from "./popover";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Popover",
  group: "Atoms",
  description:
    "A panel anchored to its trigger for details that do not fit a tooltip: a status, a few fields, a short list. Opens on click or Enter, closes on Escape or an outside press, returns focus to the trigger, and stays inside the viewport. Not modal by default, so the page stays usable. Use Menu for actions and Dialog for a decision.",
  aliases: ["flyout", "dropdown panel", "details panel", "anchored panel", "overlay panel", "info panel"],
  component: "Popover",
  source: "src/components/popover.tsx",
} satisfies StoryDefault;

export const Default = () => (
  <Popover trigger={<Button>Details</Button>} title="Build details" showTitle>
    <p className="text-ink-muted">Built from the main branch 4 minutes ago. All checks passed.</p>
  </Popover>
);

export const WithClose = () => (
  <Popover trigger={<Button>Open</Button>} title="Filters" showTitle showClose side="bottom" align="start">
    <p className="text-ink-muted">A panel with a close button for touch screens.</p>
  </Popover>
);
WithClose.storyMeta = { description: "showClose adds a close button; Escape and an outside press still close it." } satisfies StoryMeta;
