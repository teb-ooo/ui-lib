import { Button } from "./button";
import { EntrancePage } from "../entrance";
import { FatalPage } from "./fatal-page";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FatalPage",
  group: "Molecules",
  description:
    "The page for when it has truly gone wrong and there is nothing to show: a 500, a crash, an expired invitation. The enter page's swingset and its stars, ruined, in the dark and in red: the swing is thrashed by gusts, a rope snaps, the frame comes apart and falls, sparks burst, and a storm of stars is thrown outward and wheels on; then it fades to black and begins again, angrier. The message and the one way out stay legible under it. Loud on purpose: use it rarely, and not for an empty page (use NotFound or EmptyState). Reduced motion gets one still frame of the wreck; it fades through black and never strobes.",
  aliases: ["error page", "500", "crash page", "fail whale", "fatal error", "expired invitation", "glitch", "static", "noise", "something went wrong", "failure screen"],
  component: "FatalPage",
  source: "src/components/fatal-page.tsx",
} satisfies StoryDefault;

export const Default = () => (
  <div className="h-[88dvh] min-h-96 w-full">
    <FatalPage
      fullscreen={false}
      message="Something broke and it was not you. Nothing was saved."
      detail="request 01a1251c-7e44 · 500"
      action={<Button intent="solid">Try again</Button>}
    />
  </div>
);
Default.storyMeta = { description: "The error page, as an app shows it, at the full width and nearly the full height of the window. In an app it is the whole window (fullscreen, the default); give it its own route and render it from the error boundary." } satisfies StoryMeta;

export const EnterPageMock = () => (
  <div className="h-[88dvh] min-h-96 w-full overflow-hidden rounded border border-line bg-ground">
    <EntrancePage title="Sign in" contained>
      <Button intent="solid" className="bg-ground">
        Enter
      </Button>
    </EntrancePage>
  </div>
);
EnterPageMock.storyMeta = { description: "The enter page (the sign-in and invitation page), at the same size, for comparing the two." } satisfies StoryMeta;

export const ExpiredInvitation = () => (
  <div className="h-96 w-full">
    <FatalPage title="EXPIRED" fullscreen={false} message="This invitation is no longer valid. Ask whoever sent it for a new one." action={<Button>Back to sign in</Button>} />
  </div>
);
ExpiredInvitation.storyMeta = { description: "The same page with its own words for a dead end such as an expired invitation. title is the page's heading for assistive technology only." } satisfies StoryMeta;
