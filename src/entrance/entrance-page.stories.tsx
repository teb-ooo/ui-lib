import { useEffect, useState } from "react";
import { Button } from "@teb-ooo/ui";
import { EntrancePage } from "./index";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Entrance page",
  group: "Molecules",
  description:
    "The page a signed-out visitor sees first (an app's /enter and its invitation page): one centred column with a small swingset in a cloud of mist over the app's own heading, one button and, when something went wrong, one line. A real 3D scene (three.js, in its own chunk loaded after the page is usable): about 49,000 points of mist that gyrate round a line-art swingset with a rope physics seat; grab the seat and let go, drag sideways to swirl the mist. It is decoration only: it draws nothing without WebGL, shows one still frame for reduced motion, takes its colour from the theme's ink (light and dark follow) and never delays the button. Import it from @teb-ooo/ui/entrance; it needs the optional peer dependency three.",
  aliases: ["login", "sign in", "enter", "welcome", "invite", "front door", "entrance", "landing", "swingset", "3d", "animation", "mist", "signed out"],
  component: "EntrancePage",
  source: "src/entrance/entrance-page.tsx",
} satisfies StoryDefault;

export const Enter = () => {
  const [busy, setBusy] = useState(false);
  return (
    <div className="panel h-96 overflow-hidden">
      <EntrancePage title="Sign in" busy={busy} contained>
        <Button intent="solid" className="bg-ground" onClick={() => setBusy((b) => !b)}>
          {busy ? "Entering..." : "Enter"}
        </Button>
      </EntrancePage>
    </div>
  );
};
Enter.storyMeta = { description: "The scene over one button. Grab the seat and let go; drag sideways to swirl the mist. The button toggles the busy state, which keeps the swing moving while a page waits for the server. (In an app the scene covers the whole page; here it stays in its box.)" } satisfies StoryMeta;

export const WithProblem = () => (
  <div className="panel h-96 overflow-hidden">
    <EntrancePage title="Sign in" contained>
      <Button intent="solid" className="bg-ground">
        Enter
      </Button>
      <p role="alert" className="text-danger">
        The sign-in took too long. Try again.
      </p>
    </EntrancePage>
  </div>
);
WithProblem.storyMeta = { description: "When something went wrong, one line under the button (the app's own words)." } satisfies StoryMeta;

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
        <div className="fixed inset-0 z-50 bg-ground">
          <EntrancePage title="Sign in">
            <Button intent="solid" className="bg-ground">
              Enter
            </Button>
          </EntrancePage>
          <Button className="absolute top-3 right-3" onClick={() => setOpen(false)}>
            Close preview (Esc)
          </Button>
        </div>
      ) : null}
    </>
  );
};
Fullscreen.storyMeta = { description: "Opens the page over the whole window, as an app shows it (the scene takes the page's touch gestures, so it fills one screen). Escape or the button closes it." } satisfies StoryMeta;
