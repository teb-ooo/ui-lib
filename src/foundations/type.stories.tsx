import type { StoryDefault } from "../stories";

export default {
  title: "Type scale",
  group: "Foundations",
  description: "Exactly four steps, set in Geist Mono.",
} satisfies StoryDefault;

export const Scale = () => (
  <div className="flex flex-col gap-3">
    <p className="text-sm text-ink">sm 0.75rem: captions, labels, badges</p>
    <p className="text-base text-ink">base 0.875rem: body text, controls</p>
    <p className="text-lg text-ink">lg 1.125rem: headings</p>
    <p className="text-xl text-ink">xl 1.5rem: titles</p>
  </div>
);
Scale.storyMeta = { description: "The four steps side by side." };
