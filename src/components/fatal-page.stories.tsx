import { useEffect, useState } from "react";
import { Button } from "./button";
import { FatalPage } from "./fatal-page";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "FatalPage",
  group: "Molecules",
  description:
    "The page for when it has truly gone wrong and there is nothing to show: a 500, a crash, an expired invitation. The enter page's swingset and its stars, ruined, in the dark and in red: the swing is thrashed by gusts, a rope snaps, the frame comes apart and falls, sparks burst, and a storm of stars is thrown outward and wheels on; then it fades to black and begins again, angrier. The word is small and its letters are wrong. The message and the one way out stay legible under it. Loud on purpose: use it rarely, and not for an empty page (use NotFound or EmptyState). Reduced motion gets one still frame of the wreck; it fades through black and never strobes.",
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
ExpiredInvitation.storyMeta = { description: "The word is yours: it is drawn small in the dark, its letters shuffled, and is the heading for assistive technology." } satisfies StoryMeta;

export const Fullscreen = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Preview fullscreen</Button>
      {open ? (
        <FatalPage
          title="FATAL"
          message="This is what a person sees when the app has really failed. Press Escape or the button to close the preview."
          detail="request 01a1251c-7e44 · 500"
          action={<Button intent="solid" onClick={() => setOpen(false)}>Close preview</Button>}
        />
      ) : null}
    </>
  );
};
Fullscreen.storyMeta = { description: "Opens the real thing over the whole window, as an app shows it. Escape or the button closes it." } satisfies StoryMeta;
