import { Button } from "./button";
import { Tooltip } from "./tooltip";
import type { StoryDefault } from "../stories";

export default {
  title: "Tooltip",
  group: "Atoms",
  description: "The one tooltip mechanism. Never use a title attribute on a control. Button and LinkButton take a tip prop that uses this.",
  component: "Tooltip",
  source: "src/components/tooltip.tsx",
} satisfies StoryDefault;

export const Top = () => (
  <Tooltip tip="Shown above">
    <Button>Hover me</Button>
  </Tooltip>
);

export const Bottom = () => (
  <Tooltip tip="Shown below" side="bottom">
    <Button>Hover me</Button>
  </Tooltip>
);
