import { Button } from "./button";
import { Popover } from "./popover";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Popover",
  group: "Atoms",
  description:
    "One anchored panel in three modes. openOn=click (default) opens a popover for details that need interaction: a status, a few fields, a short list. openOn=hover with children is a hover card, opened by resting the pointer and also by click and Enter. openOn=hover with tip is a tooltip: one line of text, never interactive (this is what tip on Button uses). Closes on Escape, returns focus, stays inside the viewport, not modal by default. Use Menu for actions and Dialog for a decision.",
  aliases: ["hover card", "hovercard", "flyout", "dropdown panel", "details panel", "anchored panel", "overlay panel", "info panel"],
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

export const HoverCard = () => (
  <Popover openOn="hover" trigger={<Button>Hover or press Enter</Button>} title="Mother Meridian">
    <p className="text-ink-muted">Character. Last seen in the harbour of reeds.</p>
    <a href="#entry" className="text-link underline">
      Open the entry
    </a>
  </Popover>
);
HoverCard.storyMeta = { description: "openOn=hover with children: opens on hover, click and Enter; the pointer can move into it, so it may hold a link." } satisfies StoryMeta;

export const Tip = () => <Popover openOn="hover" tip="Saves the draft" trigger={<Button>Save</Button>} />;
Tip.storyMeta = { description: "openOn=hover with tip: one line, never interactive. Tooltip is this mode under its own name." } satisfies StoryMeta;

export const LongTip = () => (
  <Popover openOn="hover" trigger={<Button>Hover or focus</Button>} tip="A tip can be a sentence or two: it wraps at 20rem, never wider than the screen, and reads as a small paragraph instead of one long line running off the edge." />
);
LongTip.storyMeta = { description: "A long tip wraps at 20rem (never wider than the viewport minus a gutter)." } satisfies StoryMeta;
