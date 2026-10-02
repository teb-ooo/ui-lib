import { Chip } from "./chip";
import { LiveIndicator } from "./live-indicator";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "LiveIndicator",
  group: "Atoms",
  description:
    "A single dot that says whether a screen is receiving live updates: live (green), reconnecting (amber, pulsing), degraded (an amber ring: open, but a source is down so changes may be missed) or not live. Put it in the app header right next to the staging label. It is only a dot, never a chip and never visible text; its accessible label names the state. It takes the status useLive() from @teb-ooo/web reports.",
  aliases: ["status dot", "online", "connection", "realtime", "sse", "presence", "connected", "heartbeat"],
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

export const WithTooltip = () => <LiveIndicator status="degraded" tip />;
WithTooltip.storyMeta = {
  description: "tip adds a tooltip (true shows the status name, or pass text); the dot becomes focusable. Hover or focus it.",
} satisfies StoryMeta;

export const NextToTheStagingLabel = () => (
  <div className="flex items-center gap-2">
    <span className="text-ink">app</span>
    <Chip tone="warn">staging</Chip>
    <LiveIndicator status="live" />
  </div>
);
NextToTheStagingLabel.storyMeta = { description: "Where it goes: in the header, right beside the staging chip, as a bare dot." } satisfies StoryMeta;
