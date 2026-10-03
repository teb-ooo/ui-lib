import { Meter } from "./meter";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Meter",
  group: "Atoms",
  description:
    "A read-only measurement against a scale: a level, a signal strength, a quota. Colour is state: zones turn the bar ok, warning or danger by value. Exposed as role meter with its value, minimum and maximum. Not a progress bar (a task that finishes) and not an input (use Slider).",
  aliases: ["gauge", "level meter", "s-meter", "vu meter", "signal strength", "quota bar", "usage bar", "bar gauge"],
  component: "Meter",
  source: "src/components/meter.tsx",
} satisfies StoryDefault;

const zones = [
  { from: 0, tone: "ok" as const },
  { from: 70, tone: "warning" as const },
  { from: 90, tone: "danger" as const },
];

export const Default = () => <Meter label="Level" value={42} zones={zones} format={(v) => `${v} %`} className="w-72 max-w-full" />;
export const Warning = () => <Meter label="Level" value={78} zones={zones} format={(v) => `${v} %`} className="w-72 max-w-full" />;
Warning.storyMeta = { description: "Past 70 the bar turns warning, past 90 danger." } satisfies StoryMeta;
export const Clipping = () => <Meter label="Level" value={96} zones={zones} format={(v) => `${v} %`} className="w-72 max-w-full" />;
export const Neutral = () => <Meter label="Signal" value={5} min={0} max={9} format={(v) => `S${v}`} className="w-72 max-w-full" />;
Neutral.storyMeta = { description: "Without zones the bar is neutral." } satisfies StoryMeta;
export const Vertical = () => (
  <div className="h-40">
    <Meter label="Clip" value={60} zones={zones} orientation="vertical" />
  </div>
);
Vertical.storyMeta = { description: "orientation=vertical fills from the bottom; give it a height." } satisfies StoryMeta;
