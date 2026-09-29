import { Avatar } from "./avatar";
import type { StoryDefault } from "../stories";

export default {
  title: "Avatar",
  group: "Atoms",
  description: "Square avatar: the image when it loads, otherwise up to two initials.",
  component: "Avatar",
  source: "src/components/avatar.tsx",
} satisfies StoryDefault;

export const Initials = () => <Avatar name="alex_tebbs" />;

export const Sizes = () => (
  <div className="flex items-center gap-3">
    <Avatar name="alex" size="sm" />
    <Avatar name="alex" size="md" />
    <Avatar name="alex" size="lg" />
  </div>
);

export const Image = () => (
  <Avatar
    name="sample"
    size="lg"
    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23888'/></svg>"
  />
);
