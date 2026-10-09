import { useState } from "react";
import { Button } from "./button";
import { ColorPicker, hexToRgb, rgbToHex } from "./color-picker";
import { Popover } from "./popover";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "ColorPicker",
  group: "Molecules",
  description:
    "A colour picker: a square for saturation and brightness, a hue bar and a hex field. It gives and takes #rrggbb (hexToRgb and rgbToHex convert to and from RGB). Drag or tap the square and the bar, or use the arrow keys on them (Shift moves ten times as far); the hex field takes #rgb or #rrggbb. 16rem wide at most, so it fits a 390px phone, and it works inside a Popover.",
  aliases: ["color picker", "colour picker", "eyedropper", "swatch picker", "hue slider", "hex input", "gradient stop"],
  component: "ColorPicker",
  source: "src/components/color-picker.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [color, setColor] = useState(rgbToHex(59, 130, 246));
  const rgb = hexToRgb(color);
  return (
    <div className="flex flex-col gap-3">
      <ColorPicker label="Colour" value={color} onValueChange={setColor} />
      <p className="text-ink-muted">
        {color} is {rgb?.join(", ")} in RGB
      </p>
    </div>
  );
};
Default.storyMeta = { description: "Tap or drag the square for saturation and brightness, the bar for hue, or type a hex colour." } satisfies StoryMeta;

export const InPopover = () => {
  const [color, setColor] = useState(rgbToHex(239, 68, 68));
  return (
    <div className="pb-72">
      <Popover trigger={<Button>Stop colour {color}</Button>} title="Stop colour" showClose>
        <ColorPicker label="Stop colour" value={color} onValueChange={setColor} />
      </Popover>
    </div>
  );
};
InPopover.storyMeta = { description: "Opened from a button in a Popover, for a gradient stop or a swatch; the change is live, so the page can follow the colour as it is dragged." } satisfies StoryMeta;
