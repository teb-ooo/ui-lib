import { useState } from "react";
import { DateField } from "./date-field";
import { Modal } from "./modal";
import { Button } from "./button";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "DateField",
  group: "Atoms",
  description:
    "A calendar date, typed or picked. The box shows the date in the person's locale and takes YYYY-MM-DD while it is edited; the button beside it opens a month grid in a popover (a bottom panel on a phone). Arrow keys move by a day or a week, Page Up and Page Down by a month, Home and End to the week's ends, Enter picks. min and max grey out days; Today and Clear in the footer. The value is a YYYY-MM-DD string, with no time and no timezone.",
  aliases: ["date picker", "calendar", "datepicker", "date input", "due date", "day", "schedule"],
  component: "DateField",
  source: "src/components/date-field.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [value, setValue] = useState<string | null>("2026-10-11");
  return <DateField label="Due date" value={value} onValueChange={setValue} />;
};

export const WithLimits = () => {
  const [value, setValue] = useState<string | null>(null);
  return <DateField label="Defer until" value={value} onValueChange={setValue} min="2026-10-05" max="2026-12-31" description="From 5 October to the end of the year." />;
};
WithLimits.storyMeta = { description: "min and max grey out the days outside them, and a typed date outside them is not accepted." } satisfies StoryMeta;

export const InAModal = () => {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Modal trigger={<Button>Defer</Button>} title="Defer" footer={<Button intent="solid">Defer</Button>}>
      <DateField label="Date" value={value} onValueChange={setValue} />
    </Modal>
  );
};
InAModal.storyMeta = { description: "The calendar opens over a Modal as its own panel (stacked on a phone), not as the browser's native picker." } satisfies StoryMeta;
