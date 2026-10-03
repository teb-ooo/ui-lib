import { ImagePreview } from "./image-preview";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "ImagePreview",
  group: "Atoms",
  description:
    "A picture in the panel look: border, a max height, proportions kept, an optional Open full size link; nothing is drawn if the picture fails to load.",
  aliases: ["image", "img", "screenshot", "picture", "photo", "thumbnail", "attachment preview"],
  component: "ImagePreview",
  source: "src/components/image-preview.tsx",
} satisfies StoryDefault;

const svg = (w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="gray"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="monospace" font-size="24">${w} x ${h}</text></svg>`)}`;

export const Default = () => <ImagePreview src={svg(960, 540)} alt="A grey test picture, 960 by 540" href={svg(960, 540)} />;
Default.storyMeta = { description: "A wide picture shrinks to the max height, with the link to open it full size." } satisfies StoryMeta;

export const Tall = () => <ImagePreview src={svg(400, 1200)} alt="A tall grey test picture" maxHeight={12} />;
Tall.storyMeta = { description: "A tall picture is cut to the max height without stretching." } satisfies StoryMeta;

export const Broken = () => (
  <div>
    <p className="text-ink-muted">Below, a picture that fails to load: nothing is drawn.</p>
    <ImagePreview src="/nope-missing.png" alt="Missing" />
  </div>
);
Broken.storyMeta = { state: "error", description: "No broken-image icon: the component draws nothing." } satisfies StoryMeta;
