import { useState } from "react";
import { VolumeControl } from "./volume-control";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "VolumeControl",
  group: "Molecules",
  description:
    "A speaker button that opens a vertical volume slider over itself: the icon stays where it is and the panel hangs from it as one surface, the icon at the top and a vertical Slider below (the top is loudest, the bottom silent). The icon follows the level (muted, low, high); the icon in the panel toggles mute. Closes on Escape or a press outside; the same small column on a phone. The app owns the volume and the muted state.",
  aliases: ["volume", "mute", "speaker", "sound", "audio level", "vertical slider", "fader", "loudness"],
  component: "VolumeControl",
  source: "src/components/volume-control.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [value, setValue] = useState(0.6);
  const [muted, setMuted] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <p className="text-ink-muted">Stream</p>
      <VolumeControl value={value} onValueChange={setValue} muted={muted} onMutedChange={setMuted} />
      <p className="text-ink-faint">{muted ? "muted" : `${Math.round(value * 100)} %`}</p>
    </div>
  );
};
Default.storyMeta = { description: "Press the speaker; drag the slider to the bottom to silence it, press the icon in the panel to mute and unmute." } satisfies StoryMeta;
