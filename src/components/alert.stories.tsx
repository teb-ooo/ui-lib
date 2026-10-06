import { Button } from "./button";
import { Alert } from "./alert";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Alert",
  group: "Molecules",
  description:
    "A message that stays on the page: a failing source, data that is not backed up, a failed save, a confirmation that needs an answer. Four tones, colour is state. Announced when it appears; danger is an alert, the rest a status. Use Toast for what goes away by itself.",
  aliases: ["banner", "callout", "notice", "warning", "error message", "inline message", "confirmation", "not backed up", "failed"],
  component: "Alert",
  source: "src/components/alert.tsx",
} satisfies StoryDefault;

export const Warning = () => <Alert tone="warning">Saved recordings are a single copy on the server and are not backed up. Keep what matters somewhere else too.</Alert>;
Warning.storyMeta = { description: "A warning in the page: say what is at risk." } satisfies StoryMeta;

export const Danger = () => (
  <Alert tone="danger" title="The source keeps dropping" action={<Button>Swap source</Button>}>
    It disconnected 4 times in the last minute. The picture shows the last rows received.
  </Alert>
);
Danger.storyMeta = { description: "A failure with a title, the detail and the way out." } satisfies StoryMeta;

export const Confirm = () => (
  <Alert
    tone="danger"
    action={
      <span className="flex gap-2">
        <Button>Cancel</Button>
        <Button intent="danger">Kill</Button>
      </span>
    }
  >
    Kill this stream?
  </Alert>
);
Confirm.storyMeta = { description: "A confirmation that sits in the flow instead of floating over the content." } satisfies StoryMeta;

export const Info = () => <Alert onDismiss={() => undefined}>The rolling recording is kept for 72 hours.</Alert>;
Info.storyMeta = { description: "Neutral information, dismissible." } satisfies StoryMeta;

export const Ok = () => <Alert tone="ok">Saved as a recording.</Alert>;
Ok.storyMeta = { description: "Something worked." } satisfies StoryMeta;
