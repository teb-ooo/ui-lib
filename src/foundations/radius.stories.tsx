import type { StoryDefault } from "../stories";

export default {
  title: "Radius",
  group: "Foundations",
  description: "One radius, 0.25rem (--radius), used by every control, panel and avatar. Use the plain rounded utility.",
  aliases: ["border radius", "rounded", "corners", "rounding"],
} satisfies StoryDefault;

export const Radius = () => (
  <div className="flex items-center gap-3 text-ink-muted">
    <div className="size-16 rounded border border-line-strong bg-surface" />
    --radius: 0.25rem
  </div>
);
