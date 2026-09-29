import type { StoryDefault } from "../stories";

export default {
  title: "Type",
  group: "Foundations",
  description:
    "Two sizes. Body is 14px on a 1.6 line for everything: labels, controls, cells, captions. Display is 32px, only for page titles and empty-state headlines, through the display-lg class. Inside a size, hierarchy is weight and colour.",
} satisfies StoryDefault;

export const Body = () => (
  <div className="flex max-w-prose flex-col gap-1">
    <p className="m-0 text-ink">Body, ink: the default reading text.</p>
    <p className="m-0 text-ink-muted">Body, muted: secondary text and labels.</p>
    <p className="m-0 text-ink-faint">Body, faint: hints and placeholders.</p>
  </div>
);
Body.storyMeta = { description: "One size, three colours." };

export const Display = () => <h1 className="display-lg m-0">Page title</h1>;
Display.storyMeta = { description: "The only larger size, in the display face." };

export const Brand = () => <span className="display">factory</span>;
Brand.storyMeta = { description: "The display face at body size: the brand wordmark." };

export const Mono = () => <code>Geist Mono: 0123456789 {"{ } [ ] ( ) =>"}</code>;
Mono.storyMeta = { description: "One text face everywhere, code and controls included." };
