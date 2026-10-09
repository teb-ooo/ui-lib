import { useState } from "react";
import { FrequencyInput } from "./frequency-input";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FrequencyInput",
  group: "Molecules",
  description:
    "The hero control of a tuner: the frequency in kHz as a large readout (two decimals, zero-padded: 00740.00), a click-to-type masked editor with a Set frequency button (Enter sets, Escape or a press outside cancels, invalid values cannot be set), and a round tuning knob you drag sideways (0.5 kHz per pixel, Shift for fine tuning; mouse, finger or keyboard). Arrow keys step the readout. optimistic, dimmed and playbackMode draw the pending, locked and rewinding states.",
  aliases: ["frequency display", "tuning knob", "tuner", "vfo", "radio dial", "hero readout", "numeric dial", "frequency readout"],
  component: "FrequencyInput",
  source: "src/components/frequency-input.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [value, setValue] = useState(740);
  return (
    <div className="pb-24 pl-3">
      <FrequencyInput value={value} onValueChange={setValue} />
    </div>
  );
};
Default.storyMeta = {
  description:
    "Drag the knob, press the arrow keys on the number, or click the number to type: the editor is a frame drawn over the readout (the room under it here is only so the example's box does not clip it); nothing around the control moves.",
} satisfies StoryMeta;

export const Optimistic = () => <FrequencyInput value={10000} onValueChange={() => undefined} optimistic />;
Optimistic.storyMeta = { description: "optimistic: a change that is not confirmed yet, at half opacity." } satisfies StoryMeta;

export const Dimmed = () => <FrequencyInput value={7074} onValueChange={() => undefined} dimmed />;
Dimmed.storyMeta = { description: "dimmed: locked, at 35% and not interactive." } satisfies StoryMeta;

export const Rewinding = () => <FrequencyInput value={7074} onValueChange={() => undefined} playbackMode />;
Rewinding.storyMeta = { description: "playbackMode: the readout takes the warning colour while a recording plays back." } satisfies StoryMeta;
