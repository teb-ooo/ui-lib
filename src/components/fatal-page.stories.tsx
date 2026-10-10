import { Button } from "./button";
import { FatalPage } from "./fatal-page";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FatalPage",
  group: "Molecules",
  description:
    "The page for when it has truly gone wrong and there is nothing to show: a 500, a crash, an expired invitation. A full-screen picture of something failing in red and black: static, torn scanlines, colour channels splitting, waveforms that stop being waves, corruption blocks and a huge word that breaks up, building to a collapse and starting again worse. The message and the one way out stay legible under it. Loud on purpose: use it rarely, and not for an empty page (use NotFound or EmptyState). Reduced motion gets one still frame; it never strobes.",
  aliases: ["error page", "500", "crash page", "fail whale", "fatal error", "expired invitation", "glitch", "static", "noise", "something went wrong", "failure screen"],
  component: "FatalPage",
  source: "src/components/fatal-page.tsx",
} satisfies StoryDefault;

export const Default = () => (
  <div className="h-96 w-full">
    <FatalPage
      fullscreen={false}
      message="Something broke and it was not you. Nothing was saved."
      detail="request 01a1251c-7e44 · 500"
      action={<Button intent="solid">Try again</Button>}
    />
  </div>
);
Default.storyMeta = { description: "Drawn here inside a box. In an app it is the whole window (fullscreen, the default). Give the page its own route and render it from the error boundary." } satisfies StoryMeta;

export const ExpiredInvitation = () => (
  <div className="h-96 w-full">
    <FatalPage title="EXPIRED" fullscreen={false} message="This invitation is no longer valid. Ask whoever sent it for a new one." action={<Button>Back to sign in</Button>} />
  </div>
);
ExpiredInvitation.storyMeta = { description: "The word is yours: title is drawn in the picture and is the heading for assistive technology." } satisfies StoryMeta;
