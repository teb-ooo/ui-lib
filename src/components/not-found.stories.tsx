import { LinkButton } from "./link-button";
import { NotFound } from "./not-found";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "NotFound",
  group: "Molecules",
  description:
    "The page or pane for something that is not there: a title, one sentence and the way back. Give it to the router as the not-found component; use the pane variant when a list's detail item does not exist.",
  aliases: ["404", "not found", "missing page", "unknown address", "empty page", "no such item", "error page"],
  component: "NotFound",
  source: "src/components/not-found.tsx",
} satisfies StoryDefault;

export const Page = () => <NotFound action={<LinkButton href="#top">Back to the start</LinkButton>} />;
Page.storyMeta = { description: "A route that does not exist: heading at the display size, one sentence, the way back." } satisfies StoryMeta;

export const Pane = () => (
  <NotFound variant="pane" title="No such note" description="It may have been deleted." action={<LinkButton href="#top">Close</LinkButton>} />
);
Pane.storyMeta = { description: "An unknown item in a detail pane: body-size heading, same structure." } satisfies StoryMeta;
