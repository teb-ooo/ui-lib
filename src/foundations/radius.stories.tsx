import type { StoryDefault } from "../stories";

export default {
  title: "Radius",
  group: "Foundations",
  description: "One radius, 4px, used by every control, panel and avatar. Use the rounded-ctl utility.",
} satisfies StoryDefault;

export const Radius = () => (
  <div className="flex items-center gap-3 text-sm text-muted">
    <div className="size-16 rounded-ctl border border-line bg-surface" />
    --radius: 4px
  </div>
);
