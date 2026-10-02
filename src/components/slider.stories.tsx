import { useState } from "react";
import { RangeSlider, Slider } from "./slider";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Slider",
  group: "Atoms",
  description:
    "Chooses a number on a scale: drag the thumb or use the keyboard (arrows, Home, End, PageUp, PageDown). The value shows next to the label with its unit and is spoken with it; the thumb has a 28px touch target. RangeSlider has two thumbs for a low and a high value (a passband, a floor and ceiling) that cannot cross and keep a minimum gap. onValueCommit fires once when the person lets go.",
  aliases: ["range", "scrubber", "volume", "fader", "dial", "range input", "level", "knob", "seek bar", "two thumbs"],
  component: "Slider",
  source: "src/components/slider.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [value, setValue] = useState(40);
  return <Slider label="Volume" value={value} onValueChange={setValue} unit="%" className="w-72 max-w-full" />;
};

export const WithFormat = () => {
  const [value, setValue] = useState(2400);
  return (
    <Slider
      label="Cutoff"
      value={value}
      onValueChange={setValue}
      min={100}
      max={12000}
      step={50}
      format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} k` : String(v))}
      unit="Hz"
      description="Content above this frequency is cut."
      className="w-72 max-w-full"
    />
  );
};
WithFormat.storyMeta = { description: "format turns the number into the text shown and spoken; unit follows it." } satisfies StoryMeta;

export const Disabled = () => <Slider label="Squelch" value={20} onValueChange={() => undefined} disabled className="w-72 max-w-full" />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const Range = () => {
  const [value, setValue] = useState<[number, number]>([300, 2700]);
  return <RangeSlider label="Passband" value={value} onValueChange={setValue} min={0} max={6000} step={50} minGap={100} unit="Hz" className="w-72 max-w-full" />;
};
Range.storyMeta = { description: "Two thumbs; they keep 100 Hz apart and cannot cross." } satisfies StoryMeta;
