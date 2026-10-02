import { ArrowRight } from "lucide-react";
import { LinkButton } from "./link-button";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "LinkButton",
  group: "Atoms",
  description: "The look of Button for navigation: a real anchor, so it opens in a new tab and shows its destination.",
  aliases: ["anchor", "link", "navigation button", "href", "hyperlink"],
  component: "LinkButton",
  source: "src/components/link-button.tsx",
} satisfies StoryDefault;

export const Default = () => <LinkButton href="#docs">Documentation</LinkButton>;
Default.storyMeta = { state: "default" } satisfies StoryMeta;

export const Solid = () => (
  <LinkButton href="#start" intent="solid">
    Get started
  </LinkButton>
);

export const WithIcon = () => (
  <LinkButton href="#next" icon={<ArrowRight aria-hidden="true" className="size-4" />}>
    Next
  </LinkButton>
);

export const Current = () => (
  <LinkButton href="#here" active>
    Current page
  </LinkButton>
);
Current.storyMeta = { description: "aria-current=page and the active look." } satisfies StoryMeta;
