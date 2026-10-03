import { useState } from "react";
import { Accordion, Collapsible } from "./accordion";
import { Switch } from "./switch";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Accordion",
  group: "Atoms",
  description:
    "Sections you open and close, one header each: Enter or Space toggles, Up and Down move between headers. A header can carry a trailing control (a Switch that enables the section, a count) beside the toggle button, usable while the section is closed. Collapsible is a single section.",
  aliases: ["collapsible", "expandable section", "disclosure", "expand collapse", "foldable", "details", "sections"],
  component: "Accordion",
  source: "src/components/accordion.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [noise, setNoise] = useState(true);
  return (
    <Accordion
      className="w-96 max-w-full"
      defaultValue={["noise"]}
      items={[
        { value: "noise", title: "Noise blanker", trailing: <Switch label="Noise blanker on" checked={noise} onCheckedChange={setNoise} className="[&_span:last-child]:sr-only" />, content: <p className="text-ink-muted">Threshold and width.</p> },
        { value: "notch", title: "Notch filter", content: <p className="text-ink-muted">Frequency and depth.</p> },
        { value: "agc", title: "AGC", content: <p className="text-ink-muted">Attack, decay and hang.</p> },
      ]}
    />
  );
};
Default.storyMeta = { description: "Several can be open at once; the Switch in the first header works without opening it." } satisfies StoryMeta;

export const Single = () => (
  <Collapsible title="Advanced" className="w-96 max-w-full">
    <p className="text-ink-muted">Less used options.</p>
  </Collapsible>
);
Single.storyMeta = { description: "Collapsible: one section." } satisfies StoryMeta;
