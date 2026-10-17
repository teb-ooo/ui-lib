import { useState } from "react";
import { Button } from "./button";
import { CoverImage } from "./cover-image";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "CoverImage",
  group: "Molecules",
  description:
    "A banner picture at the top of a page, edge to edge: cropped to a fixed height (16rem, 12rem compact, 10rem on a phone) with its middle kept, fading in when loaded, and drawing nothing if it cannot be loaded. Its actions (Change cover, Generate, Remove) show on hover or focus and always on a touch screen. With no picture it is a quiet Add cover row.",
  aliases: ["banner", "hero image", "header image", "cover photo", "page cover", "notion cover"],
  component: "CoverImage",
  source: "src/components/cover-image.tsx",
} satisfies StoryDefault;

const sample = `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'><rect width='1200' height='400' fill='%23888'/><circle cx='600' cy='200' r='120' fill='%23bbb'/></svg>")}`;

export const Default = () => {
  const [src, setSrc] = useState<string | null>(sample);
  return (
    <div className="flex flex-col gap-3">
      <CoverImage
        src={src}
        alt="A grey landscape"
        onAdd={() => setSrc(sample)}
        actions={
          <>
            <Button onClick={() => setSrc(sample)}>Change cover</Button>
            <Button intent="danger" onClick={() => setSrc(null)}>
              Remove
            </Button>
          </>
        }
      />
      <p className="px-4 text-ink-muted">The page title sits under the banner. Remove the cover to see the Add cover row.</p>
    </div>
  );
};
Default.storyMeta = { description: "Hover or focus the banner for its buttons (they are always shown on a touch screen); Remove leaves the quiet Add cover row." } satisfies StoryMeta;

export const Compact = () => <CoverImage src={sample} alt="A grey landscape" size="compact" />;
Compact.storyMeta = { description: "size=compact: 12rem tall (10rem on a phone)." } satisfies StoryMeta;

export const Missing = () => (
  <div className="flex flex-col gap-2">
    <CoverImage src="/does-not-exist.png" alt="Missing" />
    <p className="px-4 text-ink-muted">The picture could not be loaded, so nothing is drawn above this line.</p>
  </div>
);
Missing.storyMeta = { description: "A picture that cannot be loaded draws nothing, not a broken-image icon." } satisfies StoryMeta;
