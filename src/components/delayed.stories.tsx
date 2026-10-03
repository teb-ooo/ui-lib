import { useState } from "react";
import { Button } from "./button";
import { Delayed } from "./delayed";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Delayed",
  group: "Atoms",
  description:
    "Wraps loading UI (a Loading line, a skeleton, a spinner) so it stays invisible for the first 100ms and then fades in. A response that arrives at once shows nothing instead of a flash. The package's own skeletons, button spinners and Searching lines already do this.",
  aliases: ["loading", "skeleton", "spinner", "loading delay", "flash of loading", "debounce loading", "suspense fallback"],
  component: "Delayed",
  source: "src/components/delayed.tsx",
} satisfies StoryDefault;

export const Default = () => {
  const [shown, setShown] = useState(0);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setShown((n) => n + 1)}>Start loading</Button>
      {shown > 0 ? (
        <Delayed key={shown} className="text-ink-faint">
          Loading... (appeared after 100ms)
        </Delayed>
      ) : null}
    </div>
  );
};
Default.storyMeta = { description: "Press the button: the line fades in after 100ms. Remove it before then and nothing was ever shown." } satisfies StoryMeta;
