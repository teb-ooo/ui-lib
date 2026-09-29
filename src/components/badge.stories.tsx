import { Badge } from "./badge";
import type { StoryDefault } from "../stories";

export default {
  title: "Badge",
  group: "Atoms",
  description: "Deprecated: use Chip. A Badge renders a Chip and is kept until 1.0 for existing imports.",
  component: "Badge",
  source: "src/components/badge.tsx",
} satisfies StoryDefault;

export const Default = () => <Badge>draft</Badge>;

export const Accent = () => <Badge tone="accent">staging</Badge>;

export const Danger = () => <Badge tone="danger">failed</Badge>;
