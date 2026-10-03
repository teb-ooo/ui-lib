import { useState } from "react";
import { Tabs } from "./tabs";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Tabs",
  group: "Atoms",
  description:
    "A row of tabs and one panel at a time. Left and Right (Home, End) move between tabs and, by default, show the panel at once; activation=manual waits for Enter or Space. The chosen tab is underlined; on a narrow screen the row scrolls sideways instead of wrapping. Use ToggleGroup to filter, not to switch panels.",
  aliases: ["tab bar", "tabbed panels", "tab list", "segmented panels", "sections switcher", "panel switcher"],
  component: "Tabs",
  source: "src/components/tabs.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [value, setValue] = useState("filters");
  return (
    <Tabs
      label="Radio panels"
      value={value}
      onValueChange={setValue}
      className="w-96 max-w-full"
      tabs={[
        { value: "filters", label: "Filters", panel: <p className="text-ink-muted">Passband, notch and noise settings.</p> },
        { value: "decoders", label: "Decoders", panel: <p className="text-ink-muted">CW, FT8 and RTTY decoders.</p> },
        { value: "log", label: "Log", badge: 12, panel: <p className="text-ink-muted">Twelve entries.</p> },
        { value: "peers", label: "Peers", panel: <p className="text-ink-muted">Listeners on this receiver.</p> },
        { value: "off", label: "Disabled", disabled: true, panel: null },
      ]}
    />
  );
};
Default.storyMeta = { description: "Arrow keys move and show the panel; a badge adds a count; a tab can be disabled." } satisfies StoryMeta;
