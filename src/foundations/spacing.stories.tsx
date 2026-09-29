import type { StoryDefault } from "../stories";

export default {
  title: "Spacing",
  group: "Foundations",
  description: "One control height, and the Tailwind spacing unit (0.25rem) used for gaps and padding.",
} satisfies StoryDefault;

export const ControlHeight = () => (
  <div className="flex items-center gap-3 text-sm text-muted">
    <div className="h-(--control-h) w-24 rounded-ctl border border-line bg-surface" />
    --control-h: 2rem
  </div>
);
ControlHeight.storyMeta = { description: "Every button and input is this tall." };

export const Steps = () => (
  <div className="flex flex-col gap-2 text-sm text-muted">
    {[1, 2, 3, 4, 6, 8].map((n) => (
      <div key={n} className="flex items-center gap-3">
        <div className="h-3 bg-accent" style={{ width: `calc(var(--spacing) * ${n})` }} />
        {n} = {n * 0.25}rem
      </div>
    ))}
  </div>
);
