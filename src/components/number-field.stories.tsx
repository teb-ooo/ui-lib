import { useState } from "react";
import { NumberField } from "./number-field";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "NumberField",
  group: "Atoms",
  description:
    "A number typed or stepped: ArrowUp and ArrowDown step (Shift is a large step, Alt a small one), Home and End jump to the limits, minus and plus buttons make it usable on a touch screen. Optional unit inside the box, tabular digits, min and max, locale-aware parsing and formatting. onValueCommit fires once on Enter, blur or when a stepper is released.",
  aliases: ["number input", "stepper", "spinner", "numeric field", "quantity", "frequency", "spin button", "increment"],
  component: "NumberField",
  source: "src/components/number-field.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [value, setValue] = useState<number | null>(7);
  return <NumberField label="Quantity" value={value} onValueChange={setValue} min={0} max={99} />;
};

export const WithUnit = () => {
  const [value, setValue] = useState<number | null>(7074);
  return <NumberField label="Frequency" value={value} onValueChange={setValue} min={0} max={30000} step={1} largeStep={100} unit="kHz" format={{ useGrouping: false }} />;
};
WithUnit.storyMeta = { description: "unit sits inside the box; Shift+Arrow steps by largeStep (100 here)." } satisfies StoryMeta;

export const Decimals = () => {
  const [value, setValue] = useState<number | null>(0.5);
  return <NumberField label="Mix" value={value} onValueChange={setValue} min={0} max={1} step={0.05} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} description="0 to 1" />;
};

export const NoSteppers = () => {
  const [value, setValue] = useState<number | null>(12);
  return <NumberField label="Gain" value={value} onValueChange={setValue} steppers={false} unit="dB" />;
};
NoSteppers.storyMeta = { description: "steppers=false for a compact box where the keyboard is enough." } satisfies StoryMeta;

export const Disabled = () => <NumberField label="Squelch" value={20} onValueChange={() => undefined} disabled />;
Disabled.storyMeta = { state: "disabled" } satisfies StoryMeta;
