import { useState } from "react";
import { Button } from "./button";
import { Sheet } from "./sheet";
import { Slider } from "./slider";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Sheet",
  group: "Molecules",
  description:
    "A panel that holds controls without leaving the page: on a phone a bottom sheet with a drag handle (drag it down to close), from the lg breakpoint a side panel. Modal by default; modal=false leaves the page usable beside it with no backdrop, for a control panel next to a live view. Title, close button, optional description and footer; focus returns to the trigger; Escape closes.",
  aliases: ["bottom sheet", "side panel", "drawer", "slide over", "action sheet", "inspector panel", "control panel", "off canvas"],
  component: "Sheet",
  source: "src/components/sheet.tsx",
} satisfies StoryDefault;

export const Modal = () => (
  <Sheet trigger={<Button>Open sheet</Button>} title="Filters" description="Choose how the list is filtered." footer={<Button intent="solid">Apply</Button>}>
    <p className="text-ink-muted">A bottom sheet on a phone, a side panel from the lg breakpoint.</p>
  </Sheet>
);
Modal.storyMeta = { description: "Modal: the page is dimmed and blocked until it closes." } satisfies StoryMeta;

export const NonModal = () => {
  const [volume, setVolume] = useState(40);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">The page stays usable while the sheet is open: {volume} %.</p>
      <Sheet modal={false} trigger={<Button>Open controls</Button>} title="Controls" side="right">
        <Slider label="Volume" value={volume} onValueChange={setVolume} unit="%" />
      </Sheet>
    </div>
  );
};
NonModal.storyMeta = { description: "modal=false: no backdrop, no blocking; it closes on Escape or its close button, not on a click outside." } satisfies StoryMeta;
