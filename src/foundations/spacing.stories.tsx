import type { StoryDefault } from "../stories";

export default {
  title: "Control height and spacing",
  group: "Foundations",
  description: "One control height, 1.75rem (--control-h), shared by buttons, inputs, chips and avatars; gaps use the Tailwind spacing unit (0.25rem).",
} satisfies StoryDefault;

export const ControlHeight = () => (
  <div className="flex items-center gap-3 text-ink-muted">
    <div className="h-(--control-h) w-24 rounded border border-line-strong bg-surface" />
    --control-h: 1.75rem
  </div>
);
ControlHeight.storyMeta = { description: "Every button, input and chip is this tall." };

export const Steps = () => (
  <div className="flex flex-col gap-2 text-ink-muted">
    {[1, 2, 3, 4, 6, 8].map((n) => (
      <div key={n} className="flex items-center gap-3">
        <div className="h-3 bg-ink-muted" style={{ width: `calc(var(--spacing) * ${n})` }} />
        {n} = {n * 0.25}rem
      </div>
    ))}
  </div>
);
