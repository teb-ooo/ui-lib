import { AudioPlayer } from "./audio-player";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "AudioPlayer",
  group: "Molecules",
  description:
    "Plays an audio file with the design system's own controls instead of the browser's native bar: play or pause, a seek slider, the time and a mute toggle. For a recording or clip; not for a live stream.",
  aliases: ["audio", "player", "play recording", "media player", "sound", "playback", "scrubber", "seek"],
  component: "AudioPlayer",
  source: "src/components/audio-player.tsx",
} satisfies StoryDefault;

// A one-second silent WAV, so the story needs no file.
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

export const Basic = () => <AudioPlayer src={SILENCE} label="Recording: 7.2 MHz AM" />;
Basic.storyMeta = { description: "Play or pause, seek, elapsed and total time, mute." } satisfies StoryMeta;
