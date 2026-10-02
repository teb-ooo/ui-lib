import { PlatformBar } from "./platform-bar";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "PlatformBar",
  group: "Molecules",
  description:
    "The platform's top bar, 1.5rem tall, one line, on every screen size. The only text is the app's name; the live dot, environment mark, Cmd+K trigger, Send feedback (owner only) and the person menu are icons with a tooltip. The Shell draws it from the platform's own data: an app never renders it and cannot add anything to it. It is exported for this gallery only.",
  aliases: ["top bar", "header", "app bar", "navbar", "platform header", "toolbar", "chrome"],
  component: "PlatformBar",
  source: "src/components/platform-bar.tsx",
} satisfies StoryDefault;

const noop = () => undefined;
const base = { appName: "tracker", live: "live" as const, signOutHref: "#sign-out", signInHref: "#sign-in", onOpenPalette: noop, profileHref: "#profile" };

export const Owner = () => <PlatformBar {...base} env="staging" user={{ name: "alex", email: "alex@example.test" }} onFeedback={noop} />;
Owner.storyMeta = { description: "Staging, signed in as the owner: the orange staging bar after the name and the feedback icon show." } satisfies StoryMeta;

export const Production = () => <PlatformBar {...base} user={{ name: "sam", email: "sam@example.test" }} />;
Production.storyMeta = { description: "Production, someone who is not the owner: no environment mark, no feedback icon." } satisfies StoryMeta;

export const SignedOut = () => <PlatformBar {...base} env="staging" user={null} />;
SignedOut.storyMeta = { description: "Signed out: the person icon becomes Sign in." } satisfies StoryMeta;

export const NotLive = () => <PlatformBar {...base} live="degraded" user={{ name: "sam" }} />;
NotLive.storyMeta = { description: "The dot is a ring while live updates are degraded." } satisfies StoryMeta;

export const Phone = () => (
  <div className="w-[390px] max-w-full">
    <PlatformBar {...base} env="staging" user={{ name: "alex", email: "alex@example.test" }} onFeedback={noop} onOpenMenu={noop} />
  </div>
);
Phone.storyMeta = { description: "At 390px the menu icon that opens the sidebar drawer joins the bar; the bar stays one line." } satisfies StoryMeta;
