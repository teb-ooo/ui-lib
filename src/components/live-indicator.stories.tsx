import { LiveIndicator } from "./live-indicator";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "LiveIndicator",
  group: "Atoms",
  description:
    "A small dot that says whether a screen is receiving live updates: live (green), reconnecting (amber, pulsing), degraded (an amber ring: open, but a source is down so changes may be missed) or not live. It takes the status useLive() from @teb-ooo/web reports and carries an accessible label.",
  component: "LiveIndicator",
  source: "src/components/live-indicator.tsx",
} satisfies StoryDefault;

export const Live = () => <LiveIndicator status="live" />;
Live.storyMeta = { state: "default" } satisfies StoryMeta;

export const Reconnecting = () => <LiveIndicator status="reconnecting" />;
Reconnecting.storyMeta = { state: "loading" } satisfies StoryMeta;

export const Degraded = () => <LiveIndicator status="degraded" />;
Degraded.storyMeta = { state: "error" } satisfies StoryMeta;

export const NotLive = () => <LiveIndicator status="off" />;
NotLive.storyMeta = { state: "disabled" } satisfies StoryMeta;

export const WithLabel = () => (
  <div className="flex flex-col gap-2">
    <LiveIndicator status="live" showLabel />
    <LiveIndicator status="reconnecting" showLabel />
    <LiveIndicator status="degraded" showLabel />
    <LiveIndicator status="off" showLabel />
  </div>
);
WithLabel.storyMeta = { description: "showLabel adds the word beside the dot." } satisfies StoryMeta;
